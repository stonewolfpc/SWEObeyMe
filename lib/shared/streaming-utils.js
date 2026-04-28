/**
 * Streaming Utilities for Unlimited File Size Handling
 * Provides transparent chunking/streaming for ALL tools without requiring AI awareness
 */

import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { Readable, Transform } from 'stream';
import { createErrorResponse, createSuccessResponse } from './error-utils.js';

// Default chunk sizes
const CHUNK_SIZE = {
  LINES: 1000,        // Lines per chunk for text files
  BYTES: 1024 * 1024, // 1MB per chunk for binary
  MAX_BUFFER: 100,    // Maximum chunks to keep in memory
};

/**
 * Stream-based file reader that handles files of ANY size
 * Automatically chunks and provides transparent access
 */
export class StreamingFileReader {
  constructor(filePath, options = {}) {
    this.filePath = filePath;
    this.chunkSize = options.chunkSize || CHUNK_SIZE.LINES;
    this.currentOffset = options.offset || 1;
    this.totalLines = 0;
    this.fileSize = 0;
    this.chunks = new Map();
    this.loadedChunks = new Set();
  }

  /**
   * Initialize and get file stats without loading content
   */
  async initialize() {
    try {
      const stats = await fs.stat(this.filePath);
      this.fileSize = stats.size;

      // Count total lines efficiently using streams
      this.totalLines = await this.countLines();

      return {
        success: true,
        fileSize: this.fileSize,
        totalLines: this.totalLines,
        totalChunks: Math.ceil(this.totalLines / this.chunkSize),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Count lines efficiently using streaming
   */
  async countLines() {
    return new Promise((resolve, reject) => {
      let lineCount = 0;
      const stream = createReadStream(this.filePath, { encoding: 'utf8' });

      stream.on('data', (chunk) => {
        lineCount += (chunk.match(/\r\n|\r|\n/g) || []).length;
      });

      stream.on('end', () => {
        // Add 1 for the last line if file doesn't end with newline
        resolve(lineCount + 1);
      });

      stream.on('error', reject);
    });
  }

  /**
   * Read specific line range - works for ANY file size
   */
  async readLines(startLine, endLine) {
    const chunkStart = Math.floor((startLine - 1) / this.chunkSize) + 1;
    const chunkEnd = Math.floor((endLine - 1) / this.chunkSize) + 1;

    const result = [];

    for (let chunkNum = chunkStart; chunkNum <= chunkEnd; chunkNum++) {
      const chunk = await this.loadChunk(chunkNum);
      if (!chunk) continue;

      const chunkStartLine = (chunkNum - 1) * this.chunkSize + 1;
      const relativeStart = Math.max(0, startLine - chunkStartLine);
      const relativeEnd = Math.min(chunk.length, endLine - chunkStartLine + 1);

      result.push(...chunk.slice(relativeStart, relativeEnd));
    }

    return result;
  }

  /**
   * Load a specific chunk into memory
   */
  async loadChunk(chunkNum) {
    if (this.chunks.has(chunkNum)) {
      return this.chunks.get(chunkNum);
    }

    // Evict old chunks if buffer is full
    if (this.loadedChunks.size >= CHUNK_SIZE.MAX_BUFFER) {
      const oldest = this.loadedChunks.values().next().value;
      this.chunks.delete(oldest);
      this.loadedChunks.delete(oldest);
    }

    const startLine = (chunkNum - 1) * this.chunkSize + 1;
    const lines = await this.readChunkFromFile(startLine, this.chunkSize);

    this.chunks.set(chunkNum, lines);
    this.loadedChunks.add(chunkNum);

    return lines;
  }

  /**
   * Read chunk from file using streaming
   */
  async readChunkFromFile(startLine, lineCount) {
    return new Promise((resolve, reject) => {
      const lines = [];
      let currentLine = 0;
      let buffer = '';

      const stream = createReadStream(this.filePath, { encoding: 'utf8' });

      stream.on('data', (chunk) => {
        buffer += chunk;
        const parts = buffer.split(/\r\n|\r|\n/);
        buffer = parts.pop(); // Keep incomplete line in buffer

        for (const line of parts) {
          currentLine++;
          if (currentLine >= startLine && currentLine < startLine + lineCount) {
            lines.push(line);
          }
          if (currentLine >= startLine + lineCount) {
            stream.destroy();
            break;
          }
        }
      });

      stream.on('end', () => {
        // Handle last line if file doesn't end with newline
        if (buffer && currentLine + 1 >= startLine && currentLine + 1 < startLine + lineCount) {
          lines.push(buffer);
        }
        resolve(lines);
      });

      stream.on('error', reject);

      stream.on('close', () => {
        resolve(lines);
      });
    });
  }

  /**
   * Read entire file in chunks - memory safe for ANY size
   */
  async *readAllChunks() {
    const totalChunks = Math.ceil(this.totalLines / this.chunkSize);

    for (let i = 1; i <= totalChunks; i++) {
      const chunk = await this.loadChunk(i);
      yield {
        chunkNum: i,
        totalChunks,
        startLine: (i - 1) * this.chunkSize + 1,
        endLine: Math.min(i * this.chunkSize, this.totalLines),
        lines: chunk,
      };
    }
  }

  /**
   * Search within file - works for ANY file size
   */
  async search(pattern, caseSensitive = false) {
    const results = [];
    const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');

    for await (const chunk of this.readAllChunks()) {
      for (let i = 0; i < chunk.lines.length; i++) {
        if (regex.test(chunk.lines[i])) {
          results.push({
            line: chunk.startLine + i,
            text: chunk.lines[i],
          });
        }
      }
    }

    return results;
  }
}

/**
 * Stream-based file writer for unlimited file sizes
 */
export class StreamingFileWriter {
  constructor(filePath) {
    this.filePath = filePath;
    this.tempPath = filePath + '.tmp';
    this.writtenLines = 0;
  }

  /**
   * Write content in chunks - handles ANY size without memory issues
   */
  async write(content, options = {}) {
    try {
      const chunkSize = options.chunkSize || CHUNK_SIZE.LINES;
      const lines = content.split(/\r\n|\r|\n/);

      // Write in chunks
      const writeStream = createWriteStream(this.tempPath, { encoding: 'utf8' });

      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        const chunkText = chunk.join('\n') + (i + chunkSize < lines.length ? '\n' : '');

        const canWrite = writeStream.write(chunkText);
        if (!canWrite) {
          await new Promise(resolve => writeStream.once('drain', resolve));
        }

        this.writtenLines += chunk.length;
      }

      writeStream.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // Atomic rename
      await fs.rename(this.tempPath, this.filePath);

      return {
        success: true,
        writtenLines: this.writtenLines,
      };
    } catch (error) {
      // Clean up temp file
      try {
        await fs.unlink(this.tempPath);
      } catch {}

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Append to existing file - works for ANY file size
   */
  async append(content) {
    try {
      const lines = content.split(/\r\n|\r|\n/);
      const writeStream = createWriteStream(this.filePath, {
        encoding: 'utf8',
        flags: 'a'
      });

      const chunkText = '\n' + lines.join('\n');

      await new Promise((resolve, reject) => {
        writeStream.write(chunkText, (err) => {
          if (err) reject(err);
          else resolve();
        });
        writeStream.end();
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

/**
 * Universal file operation - handles ANY file size transparently
 */
export async function readFileUnlimited(filePath, options = {}) {
  const reader = new StreamingFileReader(filePath, options);
  const init = await reader.initialize();

  if (!init.success) {
    return createErrorResponse('read_file', new Error(init.error), 'Initializing file reader');
  }

  // If specific range requested
  if (options.offset || options.limit) {
    const offset = options.offset || 1;
    const limit = options.limit || CHUNK_SIZE.LINES;

    const lines = await reader.readLines(offset, offset + limit - 1);

    return {
      content: [{
        type: 'text',
        text: lines.map((line, i) => `${offset + i}\t${line}`).join('\n'),
      }],
      metadata: {
        totalLines: init.totalLines,
        readLines: lines.length,
        startLine: offset,
        endLine: offset + lines.length - 1,
        hasMore: offset + lines.length - 1 < init.totalLines,
      },
    };
  }

  // For smaller files, read all at once
  if (init.totalLines <= CHUNK_SIZE.LINES) {
    const lines = await reader.readLines(1, init.totalLines);
    return {
      content: [{
        type: 'text',
        text: lines.map((line, i) => `${i + 1}\t${line}`).join('\n'),
      }],
      metadata: {
        totalLines: init.totalLines,
        readLines: lines.length,
      },
    };
  }

  // For large files, return first chunk with metadata
  const lines = await reader.readLines(1, CHUNK_SIZE.LINES);

  return {
    content: [{
      type: 'text',
      text: lines.map((line, i) => `${i + 1}\t${line}`).join('\n') +
        `\n\n[FILE CONTINUED: ${init.totalLines - CHUNK_SIZE.LINES} more lines. ` +
        `Use offset=${CHUNK_SIZE.LINES + 1} to continue reading]`,
    }],
    metadata: {
      totalLines: init.totalLines,
      readLines: CHUNK_SIZE.LINES,
      hasMore: true,
      nextOffset: CHUNK_SIZE.LINES + 1,
    },
  };
}

/**
 * Universal file write - handles ANY file size
 */
export async function writeFileUnlimited(filePath, content, options = {}) {
  const writer = new StreamingFileWriter(filePath);
  const result = await writer.write(content, options);

  if (!result.success) {
    return createErrorResponse('write_file', new Error(result.error), 'Writing file');
  }

  return createSuccessResponse(
    `Successfully wrote ${result.writtenLines} lines to ${filePath}`
  );
}

/**
 * Search file of ANY size
 */
export async function searchFileUnlimited(filePath, pattern, options = {}) {
  const reader = new StreamingFileReader(filePath, options);
  const init = await reader.initialize();

  if (!init.success) {
    return createErrorResponse('search_file', new Error(init.error), 'Initializing search');
  }

  const results = await reader.search(pattern, options.caseSensitive);

  if (results.length === 0) {
    return createSuccessResponse(`No matches found for "${pattern}"`);
  }

  const formatted = results
    .slice(0, options.maxResults || 50)
    .map(r => `Line ${r.line}: ${r.text.substring(0, 100)}`)
    .join('\n');

  return createSuccessResponse(
    `Found ${results.length} matches for "${pattern}":\n\n${formatted}`
  );
}

/**
 * Transform stream for processing file content
 */
export function createTransformStream(transformFn) {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const result = transformFn(chunk);
        callback(null, result);
      } catch (error) {
        callback(error);
      }
    },
  });
}

/**
 * Process file in chunks with custom transformation
 */
export async function processFileChunks(filePath, processFn, options = {}) {
  const reader = new StreamingFileReader(filePath, options);
  const init = await reader.initialize();

  if (!init.success) {
    return { success: false, error: init.error };
  }

  const results = [];

  for await (const chunk of reader.readAllChunks()) {
    const processed = await processFn(chunk);
    results.push(processed);
  }

  return { success: true, results };
}
