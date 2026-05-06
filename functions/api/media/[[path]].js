export async function onRequest(context) {
  const { request, env, params } = context;

  // Only allow GET and HEAD requests
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const pathArray = params.path || [];
  const key = pathArray.map(decodeURIComponent).join('/');

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const isHead = request.method === 'HEAD';
  const rangeHeader = request.headers.get('Range');
  const options = {};

  // Parse Range header if present
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      options.range = {};
      if (match[1] && match[2]) {
        options.range.offset = parseInt(match[1], 10);
        options.range.length = parseInt(match[2], 10) - parseInt(match[1], 10) + 1;
      } else if (match[1]) {
        options.range.offset = parseInt(match[1], 10);
      } else if (match[2]) {
        options.range.suffix = parseInt(match[2], 10);
      }
    }
  }

  // Fetch the object from the bound R2 bucket
  const object = isHead 
    ? await env.MY_BUCKET.head(key) 
    : await env.MY_BUCKET.get(key, options);

  if (object === null) {
    return new Response('File Not Found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('accept-ranges', 'bytes');

  // Handle HEAD request
  if (isHead) {
    headers.set('content-length', object.size.toString());
    return new Response(null, { headers, status: 200 });
  }

  // Handle Partial Content (Range request)
  if (rangeHeader && object.range) {
    const offset = object.range.offset;
    const length = object.range.length;
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set('content-length', length.toString());
    return new Response(object.body, { headers, status: 206 });
  }

  // Full object response
  headers.set('content-length', object.size.toString());
  return new Response(object.body, { headers, status: 200 });
}
