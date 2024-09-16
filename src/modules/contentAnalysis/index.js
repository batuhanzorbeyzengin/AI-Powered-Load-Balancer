const natural = require('natural');
const geoip = require('geoip-lite');

class ContentAnalysis {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  async analyze(request) {
    const contentType = this.getContentType(request);
    const contentSize = this.getContentSize(request);
    const semanticAnalysis = this.performSemanticAnalysis(request);
    const geolocation = this.getGeolocation(request);
    const userAgent = this.getUserAgent(request);

    return {
      contentType,
      contentSize,
      semanticAnalysis,
      geolocation,
      userAgent
    };
  }

  getContentType(request) {
    return request.headers['content-type'] || 'unknown';
  }

  getContentSize(request) {
    return request.headers['content-length'] || 0;
  }

  performSemanticAnalysis(request) {
    const text = request.body.text || '';
    const tokens = this.tokenizer.tokenize(text);
    this.tfidf.addDocument(tokens);
    
    return {
      tokenCount: tokens.length,
      topTerms: this.tfidf.listTerms(0 /* document index */).slice(0, 5)
    };
  }

  getGeolocation(request) {
    const ip = request.ip || request.connection.remoteAddress;
    return geoip.lookup(ip) || { country: 'unknown', region: 'unknown', city: 'unknown' };
  }

  getUserAgent(request) {
    return request.headers['user-agent'] || 'unknown';
  }
}

module.exports = ContentAnalysis;