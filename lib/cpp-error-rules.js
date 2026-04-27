/**
 * C++ Error Detection Rules — Pattern-based rule definitions.
 * Consumed by cpp-bridge.js analyzer.
 */

export const SeverityColors = {
  CRITICAL: 'red',
  WARNING: 'orange',
  INFO: 'cyan',
  ENVIRONMENTAL_DRIFT: 'magenta',
  MEMORY_LEAK: 'purple',
  TERNARY_STATE: 'silver',
};

export const SeverityLevels = {
  CRITICAL: 2,
  WARNING: 1,
  INFO: 0,
  ENVIRONMENTAL_DRIFT: 1,
  MEMORY_LEAK: 2,
  TERNARY_STATE: 0,
};

export const errorRules = [
  {
    id: 'memory_leak_raw_new',
    name: 'Potential memory leak - raw new without delete',
    color: SeverityColors.MEMORY_LEAK,
    severity: SeverityLevels.MEMORY_LEAK,
    pattern: /new\s+\w+[^[]]*\([^)]*\)(?!\s*->|\s*\.|\s*\[)/g,
    check: (content, matches) => {
      if (!matches) return null;
      const leaks = [];
      matches.forEach((match) => {
        const typeName = match.match(/new\s+(\w+)/)?.[1] || 'unknown';
        const afterMatch = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 500);
        if (!afterMatch.includes('delete') && !afterMatch.includes('unique_ptr') && !afterMatch.includes('shared_ptr')) {
          leaks.push({ match: match.substring(0, 50), type: typeName });
        }
      });
      return leaks.length > 0 ? leaks : null;
    },
  },
  {
    id: 'missing_virtual_destructor',
    name: 'Class with virtual methods lacks virtual destructor',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /class\s+(\w+)[^{]*\{[^}]*virtual\s+\w+/gs,
    check: (content, matches) => {
      if (!matches) return null;
      const violations = [];
      matches.forEach((match) => {
        const className = match.match(/class\s+(\w+)/)?.[1];
        if (!match.includes('virtual ~') && !match.includes('virtual ~' + className)) {
          violations.push(className);
        }
      });
      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'raw_array_new',
    name: 'Raw array allocation with new[] - use std::vector instead',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /new\s+\w+\s*\[[^\]]+\]/g,
    check: (content, matches) => {
      if (!matches) return null;
      return matches.length > 0 ? matches.map((m) => m.substring(0, 30)) : null;
    },
  },
  {
    id: 'missing_null_check',
    name: 'Pointer dereference without null check',
    color: SeverityColors.CRITICAL,
    severity: SeverityLevels.CRITICAL,
    pattern: /(\w+)\s*->\s*\w+/g,
    check: (content, matches) => {
      if (!matches) return null;
      const unsafe = [];
      matches.forEach((match) => {
        const ptrName = match.match(/(\w+)\s*->/)?.[1];
        const beforeMatch = content.substring(Math.max(0, content.indexOf(match) - 200), content.indexOf(match));
        const hasNullCheck =
          beforeMatch.includes(`${ptrName} != nullptr`) ||
          beforeMatch.includes(`${ptrName} != NULL`) ||
          beforeMatch.includes(`if (${ptrName})`) ||
          beforeMatch.includes(`if(${ptrName})`);
        if (!hasNullCheck && ptrName !== 'this' && ptrName !== 'self') {
          unsafe.push({ pointer: ptrName, context: match.substring(0, 40) });
        }
      });
      return unsafe.length > 0 ? unsafe : null;
    },
  },
  {
    id: 'unused_include',
    name: 'Potentially unused include directive',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /#include\s+[<"]([^>"]+)[>"]/g,
    check: (content, matches) => {
      if (!matches) return null;
      const systemHeaders = ['iostream', 'stdio.h', 'stdlib.h', 'string.h'];
      const unused = [];
      matches.forEach((match) => {
        const header = match.match(/#include\s+[<"]([^>"]+)[>"]/)?.[1];
        if (systemHeaders.includes(header)) {
          if (header === 'iostream' && !content.match(/std::(cout|cin|cerr|endl)/)) {
            unused.push(header);
          }
        }
      });
      return unused.length > 0 ? unused : null;
    },
  },
  {
    id: 'naked_delete',
    name: 'Naked delete - ensure proper RAII or smart pointers',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /delete\s+(\w+);/g,
    check: (content, matches) => {
      if (!matches) return null;
      return matches.length > 3 ? matches.map((m) => m.substring(0, 25)) : null;
    },
  },
  {
    id: 'exception_safety',
    name: 'Function may lack exception safety (raw pointer manipulation)',
    color: SeverityColors.ENVIRONMENTAL_DRIFT,
    severity: SeverityLevels.ENVIRONMENTAL_DRIFT,
    pattern: /void\s+(\w+)\s*\([^)]*\)\s*\{[^}]*new\s+[^}]*}/gs,
    check: (content, matches) => {
      if (!matches) return null;
      const unsafe = [];
      matches.forEach((match) => {
        if (!match.includes('try') && !match.includes('catch')) {
          const funcName = match.match(/void\s+(\w+)/)?.[1];
          unsafe.push(funcName);
        }
      });
      return unsafe.length > 0 ? unsafe : null;
    },
  },
  {
    id: 'buffer_overflow_risk',
    name: 'Potential buffer overflow - unsafe string/buffer operation',
    color: SeverityColors.CRITICAL,
    severity: SeverityLevels.CRITICAL,
    pattern: /(strcpy|strcat|sprintf|\bgets\b)\s*\(/g,
    check: (content, matches) => {
      if (!matches) return null;
      const unsafe = [];
      matches.forEach((match) => {
        const func = match.match(/(strcpy|strcat|sprintf|\bgets\b)/)?.[1];
        unsafe.push(func);
      });
      return unsafe.length > 0 ? unsafe : null;
    },
  },
  {
    id: 'magic_number',
    name: 'Magic number detected - consider named constant',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /[^\w](\d{3,})[^\w]/g,
    check: (content, matches) => {
      if (!matches) return null;
      const common = [0, 1, 2, 100, 256, 1024, 4096, 1000, 10000];
      const magic = matches.filter((m) => {
        const num = parseInt(m.match(/\d+/)?.[0]);
        return !common.includes(num);
      });
      return magic.length > 5 ? magic.slice(0, 5).map((m) => m.trim()) : null;
    },
  },
  {
    id: 'deep_nesting',
    name: 'Deep nesting - consider refactoring',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: null,
    check: (content) => {
      const lines = content.split('\n');
      let maxNesting = 0;
      lines.forEach((line) => {
        const indent = line.search(/\S/);
        if (indent > maxNesting) maxNesting = indent;
      });
      const nestingLevel = Math.floor(maxNesting / 2);
      return nestingLevel > 6 ? nestingLevel : null;
    },
  },
  {
    id: 'global_variable',
    name: 'Global variable - consider encapsulation',
    color: SeverityColors.WARNING,
    severity: SeverityLevels.WARNING,
    pattern: /^(?!\s*(?:#|\/\/|\/\*|\*|class|struct|namespace|enum|typedef|using))\s*(?:const\s+)?\w+\s+\w+\s*=/gm,
    check: (content, matches) => {
      if (!matches) return null;
      const globals = matches.filter((m) => {
        const before = content.substring(0, content.indexOf(m));
        const openBraces = (before.match(/{/g) || []).length;
        const closeBraces = (before.match(/}/g) || []).length;
        return openBraces === closeBraces;
      });
      return globals.length > 3 ? globals.slice(0, 5).map((m) => m.substring(0, 40)) : null;
    },
  },
  {
    id: 'implicit_conversion',
    name: 'Potential implicit type conversion',
    color: SeverityColors.INFO,
    severity: SeverityLevels.INFO,
    pattern: /(\w+)\s*=\s*(\w+)\s*;/g,
    check: (content, matches) => {
      if (!matches) return null;
      const suspicious = [];
      matches.forEach((match) => {
        if (match.includes('double') || match.includes('float')) {
          if (!match.includes('static_cast') && !match.includes('dynamic_cast')) {
            suspicious.push(match.substring(0, 50));
          }
        }
      });
      return suspicious.length > 0 ? suspicious.slice(0, 3) : null;
    },
  },
];
