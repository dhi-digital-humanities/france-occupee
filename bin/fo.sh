#!/bin/bash -e

# Load .env file if it exists
if [ -f .env ]; then
    source .env
fi

function fo-import-data {
    IMPORT_ARCHIVE="$(mktemp)"
    trap 'rm -f "$IMPORT_ARCHIVE"' EXIT

    curl -fsSL "https://static.dhi-paris.fr/data/dhip-fo/data-latest.tar.gz" -o "$IMPORT_ARCHIVE"

    mkdir -p data
    find data -mindepth 1 -maxdepth 1 ! -name placeimages -exec rm -rf {} +
    tar --no-same-owner -xzf "$IMPORT_ARCHIVE" -C data
}

function fo-deploy-data {
    DATA_VERSION="${DATA_VERSION:-$(date +%Y%m%d%H%M%S)}"

    PACKAGE_ARCHIVE="$(mktemp)"
    trap 'rm -f "$PACKAGE_ARCHIVE"' EXIT

    tar -czf "$PACKAGE_ARCHIVE" -C data \
        --owner=0 --group=0 \
        --exclude=placeimages .
    chmod 644 "$PACKAGE_ARCHIVE"

    DIRNAME="/var/storage/host/static/current/data/dhip-fo"
    FILENAME="data-${DATA_VERSION}.tar.gz"
    rsync -av \
        "$PACKAGE_ARCHIVE" \
        "app@static.dhi-paris.fr:${DIRNAME}/${FILENAME}"
    ssh "app@static.dhi-paris.fr" "ln -sfn ${DIRNAME}/${FILENAME} ${DIRNAME}/data-latest.tar.gz"
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
}

fo-$1
