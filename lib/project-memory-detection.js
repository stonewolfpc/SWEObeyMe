/**
 * Project memory detection methods
 * 
 * This module extends the ProjectMemory class with methods for detecting
 * conceptual units in code (classes, interfaces, functions) and detecting
 * domains based on keyword matching.
 * 
 * @module project-memory-detection
 */

import path from 'path';
import { ProjectMemory } from './project-memory-core.js';

/**
 * Detect conceptual units in code
 * 
 * Analyzes code to identify conceptual units such as classes, interfaces,
 * and functions. Returns an array of detected units with their types,
 * names, and line positions.
 * 
 * @param {string} code - The source code to analyze
 * @returns {Array<Object>} Array of detected conceptual units
 * 
 * @example
 * const units = projectMemory.detectConceptualUnits(code);
 * console.log(units); // [{ type: 'class', name: 'MyClass', line: 10 }, ...]
 */
ProjectMemory.prototype.detectConceptualUnits = function(code) {
  const units = [];
  const indicators = this.projectMap?.heuristics?.conceptualUnitDetection?.indicators || [];
  
  // Detect class definitions
  const classMatches = code.match(/class\s+(\w+)/g);
  if (classMatches) {
    classMatches.forEach(match => {
      const className = match.replace(/class\s+/, '');
      units.push({ type: 'class', name: className, line: code.indexOf(match) });
    });
  }
  
  // Detect interface definitions
  const interfaceMatches = code.match(/interface\s+(\w+)/g);
  if (interfaceMatches) {
    interfaceMatches.forEach(match => {
      const interfaceName = match.replace(/interface\s+/, '');
      units.push({ type: 'interface', name: interfaceName, line: code.indexOf(match) });
    });
  }
  
  // Detect function groups (simplified)
  const functionMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?\(?[^)]*\)?\s*=>/g);
  if (functionMatches) {
    functionMatches.forEach(match => {
      const funcName = match.match(/\w+/)[0];
      units.push({ type: 'function', name: funcName, line: code.indexOf(match) });
    });
  }
  
  return units;
};

/**
 * Detect domain from code
 * 
 * Analyzes code to determine its domain based on keyword matching.
 * Returns the domain with the highest match score or 'unknown' if no match.
 * 
 * @param {string} code - The source code to analyze
 * @returns {string} The detected domain name
 * 
 * @example
 * const domain = projectMemory.detectDomain(code);
 * console.log(domain); // 'auth', 'database', 'http', 'business', or 'unknown'
 */
ProjectMemory.prototype.detectDomain = function(code) {
  const domains = this.projectMap?.conventions?.domains || {};
  const detectedDomains = [];
  
  // Check for domain indicators
  const domainKeywords = {
    auth: ['login', 'user', 'session', 'token', 'password', 'auth', 'signin', 'signup'],
    database: ['query', 'migration', 'schema', 'connection', 'database', 'db', 'sql', 'table'],
    http: ['request', 'response', 'controller', 'router', 'endpoint', 'http', 'express', 'fastify'],
    business: ['service', 'manager', 'handler', 'business', 'logic', 'process']
  };
  
  const lowerCode = code.toLowerCase();
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    const matches = keywords.filter(keyword => lowerCode.includes(keyword));
    if (matches.length > 0) {
      detectedDomains.push({ domain, matches, score: matches.length });
    }
  }
  
  // Sort by score and return top match
  detectedDomains.sort((a, b) => b.score - a.score);
  return detectedDomains.length > 0 ? detectedDomains[0].domain : 'unknown';
};
