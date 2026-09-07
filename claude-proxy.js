// Netlify serverless function: proxies requests to the Anthropic API.
//
// Why this exists: the election simulator's frontend code calls this function
// instead of api.anthropic.com directly. Your real API key lives only here,
// as a Netlify environment variable — it is never sent to, or visible from,
// anyone's browser. The frontend sends the same request body it always did
// (model, max_tokens, messages, tools); this function just adds authentication
// and forwards it.
//
// Setup (one-time):
//   1. Get an API key at https://console.anthropic.com/settings/keys
//   2. In your Netlify site: Site configuration -> Environment variables ->
//      Add a variable named ANTHROPIC_API_KEY with that key as the value.
//   3. Deploy (or redeploy) the site. Netlify auto-detects functions in
//      netlify/functions/ — no extra config needed for a basic setup.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: {
          message: 'ANTHROPIC_API_KEY is not set on this Netlify site. Add it under Site configuration -> Environment variables, then redeploy.'
        }
      })
    };
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: event.body
    });

    const text = await response.text();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: { message: 'Could not reach the Anthropic API: ' + err.message } })
    };
  }
};
