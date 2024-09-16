const crypto = require('crypto');
const geoip = require('geoip-lite');

class SecurityRouter {
  constructor(serverProfiler) {
    this.serverProfiler = serverProfiler;
    this.securityLevels = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3
    };
  }

  async routeSecurely(request, servers) {
    const securityLevel = this.assessSecurityLevel(request);
    const geolocation = this.getGeolocation(request);
    const compliantServers = this.filterCompliantServers(servers, securityLevel, geolocation);

    if (compliantServers.length === 0) {
      throw new Error('No compliant servers available for the required security level');
    }

    return this.selectOptimalServer(compliantServers, securityLevel);
  }

  assessSecurityLevel(request) {
    const hasAuthToken = !!request.headers['authorization'];
    const isEncrypted = request.secure;
    const sensitiveDataPattern = /(password|credit_card|ssn)/i;
    const containsSensitiveData = sensitiveDataPattern.test(JSON.stringify(request.body));

    if (containsSensitiveData || request.url.includes('/admin')) {
      return this.securityLevels.HIGH;
    } else if (hasAuthToken || isEncrypted) {
      return this.securityLevels.MEDIUM;
    }
    return this.securityLevels.LOW;
  }

  getGeolocation(request) {
    const ip = request.ip || request.connection.remoteAddress;
    return geoip.lookup(ip) || { country: 'unknown' };
  }

  filterCompliantServers(servers, requiredSecurityLevel, geolocation) {
    return servers.filter(server => {
      const meetsSecurityLevel = server.securityLevel >= requiredSecurityLevel;
      const meetsGeoRequirement = this.isGeoCompliant(server, geolocation);
      return meetsSecurityLevel && meetsGeoRequirement;
    });
  }

  isGeoCompliant(server, requestGeolocation) {
    if (server.dataLocalizationRequirements) {
      return server.allowedCountries.includes(requestGeolocation.country);
    }
    return true;
  }

  selectOptimalServer(compliantServers, securityLevel) {
    // For high security, prefer the server with the lowest load
    if (securityLevel === this.securityLevels.HIGH) {
      return compliantServers.reduce((a, b) => a.currentLoad < b.currentLoad ? a : b);
    }

    // For medium and low security, balance between security features and load
    return compliantServers.reduce((a, b) => {
      const scoreA = this.calculateServerScore(a, securityLevel);
      const scoreB = this.calculateServerScore(b, securityLevel);
      return scoreA > scoreB ? a : b;
    });
  }

  calculateServerScore(server, securityLevel) {
    const loadScore = 1 - (server.currentLoad / 100);
    const securityScore = server.securityLevel / this.securityLevels.HIGH;
    
    // Adjust weights based on required security level
    const loadWeight = securityLevel === this.securityLevels.HIGH ? 0.3 : 0.7;
    const securityWeight = 1 - loadWeight;

    return (loadScore * loadWeight) + (securityScore * securityWeight);
  }
}

module.exports = SecurityRouter;