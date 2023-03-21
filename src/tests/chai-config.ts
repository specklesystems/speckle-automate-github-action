'use strict'
import chai from 'chai'
import sinonChai from 'sinon-chai'

chai.config.includeStack = true
chai.config.showDiff = true
chai.config.truncateThreshold = 0 // disable truncation
chai.use(sinonChai)
export default chai
