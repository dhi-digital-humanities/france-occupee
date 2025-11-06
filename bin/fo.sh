#!/bin/bash -e

source .env

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
    export ROOT_URL="https://www.adresses-france-occupee.fr/"
    export APP_ENV=production

    npm run build

    rsync -av --progress \
    ./_site/ \
    app@prod.server.dhip-paris.fr:/some/path/

    rsync -av --progress --inplace ./data/tiles/ app@prod.server.dhip-paris.fr:/some/path/
}

fo-$1
