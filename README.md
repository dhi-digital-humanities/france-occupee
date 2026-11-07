# La France sous l'Occupation 1940-1945 - Les administrations allemandes et françaises

This repository contains the source code for the project's [database application](https://www.adresses-france-occupee.fr).

The application is a static SPA based on [eleventy](https://www.11ty.dev/). It uses [RiotJS](https://riot.js.org/), [SASS](https://sass-lang.com) and the [web worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).

The app-ready data snapshot is downloaded into the `/data` directory (gitignored); the map component additionally uses [PROTOMAPS](https://protomaps.com).

## Development

The build process requires a working [NodeJS](https://nodejs.org) environment. To get started, run

    git clone https://github.com/dhi-digital-humanities/france-occupee.git
    cd france-occupee
    npm install
    npm run import-data
    npm run dev

in the project directory and then navigate to http://localhost:3000 with your browser. `npm run import-data` downloads the data archive from static.dhi-paris.fr and extracts it into the `data` directory.

### Tests

The tests are bundled before they run: `test/index.spec.js` is built to `tmp/test.mjs`. For a single run:

    npm run build-js
    node --test tmp/test.mjs

`npm test` runs the same bundle in watch mode. Tests need `data/places.json` and `data/thesaurus.json` from `npm run import-data`; `test/place-images.spec.js` additionally needs `data/placeimages/`. The specs cover hierarchy URL encoding, term and thesaurus matching, component assets and place-image references.

## Data

### Pull

    npm run import-data

This downloads `https://static.dhi-paris.fr/data/dhip-fo/data-latest.tar.gz` and replaces the contents of `data/` with its own, except `placeimages/`, which is left untouched. The archive holds `places.json`, `services.json`, `sources.json` and `thesaurus.json`.

The `placeimages/` directory isn't part of the downloaded archive, please contact
info@dhi-paris.fr if you'd like to receive a copy.

### Push

    npm run deploy-data

This packages everything in `data/` except `placeimages/` as `data-YYYYMMDDHHMMSS.tar.gz`, uploads it to `https://static.dhi-paris.fr/data/dhip-fo/` and points the `data-latest.tar.gz` symlink at it. Set `DATA_VERSION` to use a different snapshot name.

### Zenodo

The archival research dataset is published on Zenodo: [10.5281/zenodo.11203510](https://doi.org/10.5281/zenodo.11203510). Its JSON/CSV exports are not in the format this app consumes; the archive above is the app-ready snapshot derived from the curated data.

### Data quirks

- `status` is `visible`, `pending` or `deleted`, on both places and services.
- Deleted services and services at deleted places appear in the hierarchy sidebar but never in the results. The sidebar deliberately keeps them so branches do not disappear.
- Pending services are hidden everywhere. Services at pending places can still be listed and shown in the hierarchy, but the map only includes places whose status is `visible`.
- Some services have no `place_id` and therefore no map position.
- Some service names begin with `-` or a space (a few place names also start with a space). These prefixes were added in the legacy data to influence ordering in the hierarchy; they are intentional, not typos, and remain part of the displayed name.
- `image_path` is a presence flag, not a path: it is normalized to `{place_id}.jpg` and the app requests `data/placeimages/{place_id}.jpg`. A few legacy-named photos remain on disk without a matching flag.
- Field names such as `image_path` and `d_breadcrumb` are inherited from the legacy data model; see below.

## Deployment

Deployment requires a web server (e.g. Apache, Nginx or such) with [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests) and preferably with enabled response compression, plus SSH access to the deploy host.

    npm run deploy

This sets the production URL, Matomo and PMTiles settings, builds the production bundle into `_site/`, and syncs it to `app@static.dhi-paris.fr:/var/storage/host/fo/current/`.

## Legacy

The project began as a FileMaker database, was later published as a PHP web application, and is now this static Eleventy/Riot SPA, which performs all filtering and searching in a Web Worker. The JSON field names and some of the data quirks above still reflect that FileMaker/PHP lineage.
