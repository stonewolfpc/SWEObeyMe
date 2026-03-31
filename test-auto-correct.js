// Test file with forbidden patterns
function testFunction() {
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern("This should be auto-corrected");
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern fix this later
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern
  // [REMOVED BY SWEObeyMe]: Forbidden Pattern"dangerous code");
  return true;
}

module.exports = { testFunction };