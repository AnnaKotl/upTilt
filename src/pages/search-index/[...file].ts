import type { APIRoute } from 'astro';
import { createIndex } from 'pagefind';
import { knowledgeRecords } from '../../lib/knowledge-index';

// The same endpoint produces the chunked static index in development and on Pages.
export async function getStaticPaths() {
  const { index, errors } = await createIndex({});
  if (!index) throw new Error(errors.join('\n'));
  try {
    for (const record of knowledgeRecords()) {
      const result = await index.addCustomRecord(record);
      if (result.errors.length) throw new Error(result.errors.join('\n'));
    }
    const result = await index.getFiles();
    if (result.errors.length) throw new Error(result.errors.join('\n'));
    return result.files
      .filter(
        (file) =>
          !/^(pagefind-(?:(?:component|modular)-)?ui\.|pagefind-highlight\.)/.test(
            file.path,
          ),
      )
      .map((file) => ({
        params: { file: file.path },
        props: { bytes: file.content },
      }));
  } finally {
    await index.deleteIndex();
  }
}
export const GET: APIRoute = ({ props, params }) =>
  new Response(new Uint8Array(props.bytes), {
    headers: {
      'Content-Type': params.file?.endsWith('.js')
        ? 'text/javascript'
        : params.file?.endsWith('.json')
          ? 'application/json'
          : 'application/octet-stream',
    },
  });
