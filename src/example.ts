import fs from 'fs'

import {reporter} from 'vfile-reporter'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import remarkRehype from 'remark-rehype'
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'

import tanglePlugin from './index.js'

const buffer = fs.readFileSync('./example.md')

unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(tanglePlugin)
  .use(remarkRehype)
  .use(rehypeFormat)
  .use(rehypeStringify)
  .process(buffer)
  .then((file) => {
    console.error(reporter(file))
    console.log(String(file))
  })
