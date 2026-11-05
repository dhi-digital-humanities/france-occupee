# La France sous l'Occupation 1940-1945 - Les administrations allemandes et françaises

This repository contains the source code for the project's [database application](https://www.adresses-france-occupee.fr).

The application is a static SPA based on [eleventy](https://www.11ty.dev/). It uses [RiotJS](https://riot.js.org/), [SASS](https://sass-lang.com) and the [web worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

The data is included within the `/data` directory and the map component additionally uses [PROTOMAPS](https://protomaps.com).

## Development

The build process requires a working [NodeJS](https://nodejs.org) environment. To get started, run

    git clone https://github.com/dhi-digital-humanities/france-occupee.git
    cd france-occupee
    npm install
    DATA_SHARE="..." npm run import
    npm run dev

in the project directory and then navigate to http://localhost:3000 with your browser.

## Deployment

Deployment requires a web server (e.g. Apache, Nginx or such) with [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) and preferrably with enabled response compression. To deploy for production, set up a local development environment like shown above, then run

    npm run build

and upload the content within the `_site` directory to your web server's document root.
