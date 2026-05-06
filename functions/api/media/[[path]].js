export async function onRequestGet(context) {
  // Extract the path segments and join them to form the R2 object key
  const pathArray = context.params.path || [];
  
  // We need to decode the URI components because the URL might contain encoded spaces
  const key = pathArray.map(decodeURIComponent).join('/');

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  // Fetch the object from the bound R2 bucket
  const object = await context.env.MY_BUCKET.get(key);

  if (object === null) {
    return new Response('File Not Found', { status: 404 });
  }

  // Forward the headers to the client
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  // Return the object body with the correct headers
  return new Response(object.body, { headers });
}
