# La France sous l'Occupation 1940-1945 - Les administrations allemandes et françaises

This repository contains the source code for the project's [database application](https://www.adresses-france-occupee.fr).

The application is a static SPA based on [eleventy](https://www.11ty.dev/). It uses [RiotJS](https://riot.js.org/), [SASS](https://sass-lang.com) and the [web worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

The data is included within the `/data` directory and the map component additionally uses [PROTOMAPS](https://protomaps.com).

## Development

The build process requires a working [NodeJS](https://nodejs.org) environment. To get started, run

    git clone https://github.com/dhi-digital-humanities/france-occupee.git
    cd france-occupee
    npm install
    npm run import-data
    npm run dev

in the project directory and then navigate to http://localhost:3000 with your browser. `npm run import-data` downloads the data archive from static.dhi-paris.fr (about 100 MB) and extracts it into the `data` directory.

## Deployment

Deployment requires a web server (e.g. Apache, Nginx or such) with [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) and preferrably with enabled response compression. To deploy for production, set up a local development environment like shown above, then run

    npm run build

and upload the content within the `_site` directory to your web server's document root.

## Data snapshots

`npm run import-data` downloads `data-latest.tar.gz` from `https://static.dhi-paris.fr/data/dhip-fo/`. To publish the current `data` directory as a snapshot, run

    npm run deploy-data

This uploads `data-YYYYMMDDHHMMSS.tar.gz` and points `data-latest.tar.gz` at it; set `DATA_VERSION` to override the timestamp.
