/**
 * Document Converter for PDF, Office, and other document types
 * Extracts text from binary document formats so AI can read them
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { createErrorResponse, createSuccessResponse } from './error-utils.js';

// Document type definitions
export const DOCUMENT_TYPES = {
  // Microsoft Office
  DOCX: { ext: ['.docx'], mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extractor: 'docx' },
  DOC: { ext: ['.doc'], mime: 'application/msword', extractor: 'antiword' },
  XLSX: { ext: ['.xlsx'], mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extractor: 'xlsx' },
  XLS: { ext: ['.xls'], mime: 'application/vnd.ms-excel', extractor: 'xls' },
  PPTX: { ext: ['.pptx'], mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', extractor: 'pptx' },
  PPT: { ext: ['.ppt'], mime: 'application/vnd.ms-powerpoint', extractor: 'ppt' },
  
  // PDF
  PDF: { ext: ['.pdf'], mime: 'application/pdf', extractor: 'pdf' },
  
  // eBooks
  EPUB: { ext: ['.epub'], mime: 'application/epub+zip', extractor: 'epub' },
  MOBI: { ext: ['.mobi', '.azw', '.azw3'], mime: 'application/x-mobipocket-ebook', extractor: 'mobi' },
  
  // Markup
  TEX: { ext: ['.tex'], mime: 'application/x-tex', extractor: 'text' },
  LATEX: { ext: ['.latex'], mime: 'application/x-latex', extractor: 'text' },
  
  // Data
  ODT: { ext: ['.odt'], mime: 'application/vnd.oasis.opendocument.text', extractor: 'odt' },
  ODS: { ext: ['.ods'], mime: 'application/vnd.oasis.opendocument.spreadsheet', extractor: 'ods' },
  ODP: { ext: ['.odp'], mime: 'application/vnd.oasis.opendocument.presentation', extractor: 'odp' },
};

/**
 * Detect document type from file extension
 */
export function detectDocumentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  for (const [type, info] of Object.entries(DOCUMENT_TYPES)) {
    if (info.ext.includes(ext)) {
      return { type, ...info };
    }
  }
  
  return null;
}

/**
 * Check if file is a binary document that needs conversion
 */
export function isBinaryDocument(filePath) {
  const docType = detectDocumentType(filePath);
  return docType !== null && docType.extractor !== 'text';
}

/**
 * Check if external tool is available
 */
function checkToolAvailable(tool) {
  try {
    execSync(`where ${tool}`, { stdio: 'pipe', windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract text from PDF using available tools
 */
async function extractPdfText(filePath) {
  const tools = [
    { name: 'pdftotext', priority: 1, args: [filePath, '-'] },
    { name: 'pdf2txt', priority: 2, args: [filePath] },
  ];
  
  // Try native tools first
  for (const tool of tools.sort((a, b) => a.priority - b.priority)) {
    if (checkToolAvailable(tool.name)) {
      try {
        const result = spawn(tool.name, tool.args, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024, // 10MB max
          windowsHide: true,
          timeout: 30000,
        });
        
        return new Promise((resolve, reject) => {
          let stdout = '';
          let stderr = '';
          
          result.stdout.on('data', (data) => {
            stdout += data.toString('utf8');
          });
          
          result.stderr.on('data', (data) => {
            stderr += data.toString('utf8');
          });
          
          result.on('close', (code) => {
            if (code === 0 && stdout) {
              resolve(stdout);
            } else {
              reject(new Error(stderr || `Exit code ${code}`));
            }
          });
          
          result.on('error', reject);
        });
      } catch {
        continue;
      }
    }
  }
  
  // Fallback: Try to use pdf-parse if available
  try {
    const { default: pdfParse } = await import('pdf-parse');
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  } catch {
    throw new Error(
      'No PDF extraction tool available. Install one of:\n' +
      '  - pdftotext (Xpdf/Poppler): https://github.com/josch/binaries\\n' +
      '  - pdf2txt (Python): pip install pdfminer.six\\n' +
      '  - pdf-parse: npm install pdf-parse'
    );
  }
}

/**
 * Extract text from DOCX
 */
async function extractDocxText(filePath) {
  try {
    // Try native Node.js solution
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch {
    // Fallback: try antiword for .doc files
    if (checkToolAvailable('antiword')) {
      try {
        const result = execSync(`antiword "${filePath}"`, {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
          windowsHide: true,
          timeout: 30000,
        });
        return result;
      } catch {
        // Continue to error
      }
    }
    
    throw new Error(
      'No DOCX extraction tool available. Install:\n' +
      '  - mammoth.js: npm install mammoth'
    );
  }
}

/**
 * Extract text from XLSX
 */
async function extractXlsxText(filePath) {
  try {
    const xlsx = await import('xlsx');
    const workbook = xlsx.readFile(filePath);
    
    let text = '';
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(sheet);
      text += `=== Sheet: ${sheetName} ===\n${csv}\n\n`;
    }
    
    return text;
  } catch {
    throw new Error(
      'No XLSX extraction tool available. Install:\n' +
      '  - xlsx: npm install xlsx'
    );
  }
}

/**
 * Extract text from PPTX
 */
async function extractPptxText(filePath) {
  try {
    // Try using a PPTX extraction library
    const { default: PptxTextExtractor } = await import('pptx-text-extractor');
    const extractor = new PptxTextExtractor();
    const text = await extractor.extractText(filePath);
    return text;
  } catch {
    // Try alternative: treat as ZIP and extract
    try {
      const { default: AdmZip } = await import('adm-zip');
      const zip = new AdmZip(filePath);
      
      let text = '';
      const entries = zip.getEntries();
      
      for (const entry of entries) {
        if (entry.entryName.endsWith('.xml') && entry.entryName.includes('slides/')) {
          const content = entry.getData().toString('utf8');
          // Simple XML text extraction
          const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
          if (textMatches) {
            text += textMatches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ') + '\n';
          }
        }
      }
      
      if (text) return text;
    } catch {
      // Continue to error
    }
    
    throw new Error(
      'No PPTX extraction tool available. Install:\n' +
      '  - pptx-text-extractor: npm install pptx-text-extractor'
    );
  }
}

/**
 * Extract text from EPUB
 */
async function extractEpubText(filePath) {
  try {
    const { default: EPub } = await import('epub');
    
    return new Promise((resolve, reject) => {
      const epub = new EPub(filePath);
      let text = '';
      
      epub.on('end', () => {
        // Get all chapters
        const chapters = epub.flow;
        let completed = 0;
        
        if (chapters.length === 0) {
          resolve('');
          return;
        }
        
        chapters.forEach((chapter, index) => {
          epub.getChapter(chapter.id, (err, chapterText) => {
            if (!err && chapterText) {
              // Strip HTML
              const plainText = chapterText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
              text += `\n\n=== Chapter ${index + 1} ===\n${plainText}`;
            }
            
            completed++;
            if (completed === chapters.length) {
              resolve(text.trim());
            }
          });
        });
      });
      
      epub.on('error', reject);
      epub.parse();
    });
  } catch {
    // Fallback: treat as ZIP
    try {
      const { default: AdmZip } = await import('adm-zip');
      const zip = new AdmZip(filePath);
      
      let text = '';
      const entries = zip.getEntries();
      
      for (const entry of entries) {
        if (entry.entryName.endsWith('.html') || entry.entryName.endsWith('.xhtml')) {
          const content = entry.getData().toString('utf8');
          const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          text += plainText + '\n\n';
        }
      }
      
      if (text) return text;
    } catch {
      // Continue to error
    }
    
    throw new Error(
      'No EPUB extraction tool available. Install:\n' +
      '  - epub: npm install epub'
    );
  }
}

/**
 * Extract text from ODF (OpenDocument)
 */
async function extractOdfText(filePath) {
  try {
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(filePath);
    
    // Read content.xml
    const contentEntry = zip.getEntry('content.xml');
    if (!contentEntry) {
      throw new Error('No content.xml found in ODF file');
    }
    
    const content = contentEntry.getData().toString('utf8');
    
    // Simple XML text extraction (more sophisticated parsing can be added)
    const textMatches = content.match(/<text:p[^>]*>([^]*?)<\/text:p>/g);
    if (textMatches) {
      return textMatches
        .map(p => p.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
        .filter(p => p)
        .join('\n\n');
    }
    
    return '';
  } catch {
    throw new Error('Failed to extract ODF content');
  }
}

/**
 * Main document extraction dispatcher
 */
export async function extractDocumentText(filePath, options = {}) {
  const docType = detectDocumentType(filePath);
  
  if (!docType) {
    // Not a known document type - try as text file
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return {
        success: true,
        text: content,
        type: 'text',
        wasBinary: false,
      };
    } catch (error) {
      return {
        success: false,
        error: `File is not a readable text file: ${error.message}`,
        type: 'unknown',
      };
    }
  }
  
  try {
    let text;
    
    switch (docType.extractor) {
      case 'pdf':
        text = await extractPdfText(filePath);
        break;
      case 'docx':
        text = await extractDocxText(filePath);
        break;
      case 'xlsx':
        text = await extractXlsxText(filePath);
        break;
      case 'pptx':
        text = await extractPptxText(filePath);
        break;
      case 'epub':
        text = await extractEpubText(filePath);
        break;
      case 'odt':
      case 'ods':
      case 'odp':
        text = await extractOdfText(filePath);
        break;
      case 'text':
        text = await fs.readFile(filePath, 'utf8');
        break;
      default:
        throw new Error(`No extractor available for ${docType.type}`);
    }
    
    // Clean up text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    // Truncate if too large
    const maxLength = options.maxLength || 1000000; // 1MB default
    const wasTruncated = text.length > maxLength;
    if (wasTruncated) {
      text = text.substring(0, maxLength) + 
        `\n\n[DOCUMENT TRUNCATED: Showing first ${maxLength} characters. ` +
        `Full document has ${text.length} characters.]`;
    }
    
    return {
      success: true,
      text,
      type: docType.type,
      wasBinary: true,
      wasTruncated,
      originalLength: wasTruncated ? text.length + (text.length - maxLength) : text.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      type: docType.type,
      installHelp: getInstallHelp(docType.type),
    };
  }
}

/**
 * Get installation help for missing tools
 */
function getInstallHelp(type) {
  const help = {
    PDF: 'Install pdftotext from Xpdf/Poppler, or run: npm install pdf-parse',
    DOCX: 'Run: npm install mammoth',
    XLSX: 'Run: npm install xlsx',
    PPTX: 'Run: npm install pptx-text-extractor',
    EPUB: 'Run: npm install epub adm-zip',
    ODT: 'Run: npm install adm-zip',
  };
  
  return help[type] || 'No specific installation help available';
}

/**
 * Extract document and return as read_file compatible response
 */
export async function readDocumentAsText(filePath, options = {}) {
  const result = await extractDocumentText(filePath, options);
  
  if (!result.success) {
    return createErrorResponse(
      'read_file',
      new Error(result.error),
      `Extracting ${result.type} document`,
      { 
        expected: true,
        guidance: result.installHelp,
      }
    );
  }
  
  const header = `[DOCUMENT: ${path.basename(filePath)} | Type: ${result.type}${result.wasTruncated ? ' | Truncated' : ''}]\n\n`;
  
  return createSuccessResponse(header + result.text);
}

/**
 * List supported document types
 */
export function listSupportedDocumentTypes() {
  return Object.entries(DOCUMENT_TYPES).map(([type, info]) => ({
    type,
    extensions: info.ext,
    mimeType: info.mime,
    extractor: info.extractor,
  }));
}
