#!/bin/bash -e

export ROOT_URL="https://www.adresses-france-occupee.fr/"
export APP_ENV=production

npm run build

rsync -av --progress \
  ./_site/ \
  app@prod.server.dhip-paris.fr:/some/path/

rsync -av --progress --inplace ./data/tiles/ app@prod.server.dhip-paris.fr:/some/path/
