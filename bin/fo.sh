#!/bin/bash -e

# Load .env file if it exists
if [ -f .env ]; then
    source .env
fi

function fo-import {
    rm -rf data
    mkdir -p data

    FILES="place service service_bridge source"
    for FILE in $FILES; do
        SRC_PATH="/public.php/dav/files/$DATA_SHARE/json/$FILE.json"
        URL="https://share.wendig.io$SRC_PATH"
        TARGET="data/$FILE.json"
        curl -s "$URL" -o $TARGET
    done
}

function fo-deploy {
    export ROOT_URL="https://adresses-france-occupee.fr"
    export APP_ENV=production
    export PMTILES_URL="https://static.dhi-paris.fr/The6dei1/20251217.pmtiles"
    export MATOMO_URL="https://visits.maxweberstiftung.de"
    export MATOMO_SITE_ID="4"

    npm run build

    rsync -av \
    ./_site/ \
    app@static.dhi-paris.fr:/var/storage/host/fo/current/

    # rsync -av \
    # ./assets/loader.js \
    # app@static.dhi-paris.fr:/var/storage/host/static/current/fo/loader.js

    # temporary: deploy loader script also to wendig
    # rsync -av \
    # ./assets/loader.js \
    # app@prime.wendig.io:/var/storage/host/static/current/private/Ohd7eita/app.js
}

fo-$1
