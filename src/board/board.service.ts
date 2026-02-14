import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { ReadStream } from 'fs';
import { Buffer } from 'node:buffer';

@Injectable()
export class BoardService {
  async getBoard() {
    return this.getInitialBoard();
  }

  async getInitialBoard() {
    const testFileAsReadableStream = createReadStream(
      path.join(process.cwd(), '/board.init.json'),
    );

    const streamToString = async (stream: ReadStream) => {
      const chunks = [];
      for await (const chunk of stream) {
        // @ts-expect-error dunno
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks).toString('utf-8');
    };

    const myText = await streamToString(testFileAsReadableStream);
    console.log(myText);
    return myText;
  }
}
