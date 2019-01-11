import '@babel/polyfill';
import { config } from 'dotenv';

config();

import { createHash } from 'crypto';
import { createServer, plugins } from 'restify';
import { URL } from 'url';
import chatDown from 'chatdown';
import fetch from 'node-fetch';
import renderWebChat from './renderWebChat';

const server = createServer();

server.use(plugins.queryParser());

server.get('/chatdown', async (req, res) => {
  try {
    const baseURL = new URL(req.query.url);
    const { hostname } = baseURL;

    if (
      hostname !== 'raw.githubusercontent.com'
      && hostname !== 'github.com'
      && hostname !== 'www.github.com'
    ) {
      return res.send(400);
    }

    const chatdownRes = await fetch(baseURL.toString());

    if (!chatdownRes.ok) {
      return res.send(404);
    }

    let chatdown = await chatdownRes.text();
    const hash = createHash('sha256');

    hash.update(chatdown);

    const eTag = hash.digest('hex');

    chatdown = chatdown.replace(
      /\[Attachment\s*=\s*([^\s\]]*)(.*?\])/g,
      (_, url, ending) => {
        const nextURL = new URL(url, baseURL);

        return `[Attachment=${ nextURL }${ ending }`;
      }
    );

    const activities = await chatDown(chatdown);

    res.setHeader('Cache-Control', 'max-age=120');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('ETag', eTag);
    res.end(await renderWebChat(activities));
  } catch({ message, stack }) {
    console.warn(message);
    res.json(500, { message, stack });
  }
});

server.listen(process.env.PORT, '0.0.0.0');
