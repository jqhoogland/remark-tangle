import fs from 'fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import remarkRehype from 'remark-rehype';
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from "remark-gfm";

import tanglePlugin from './tanglePlugin';

const buffer = fs.readFileSync('./demo/example.md');

unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkDirective)
  .use(tanglePlugin)
  .use(remarkRehype)
  .use(rehypeFormat)
  .use(rehypeStringify)
  .process(buffer)
  .then((file) => {
    // console.error(reporter(file))
    console.log(String(file))
  });
