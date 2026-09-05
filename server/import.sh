#!/bin/bash
for f in /db_dump/*.json; do
  col=$(basename $f .json)
  echo "Importing $col from $f..."
  mongoimport --uri mongodb://localhost:27017/office_manage_system --collection $col --type json --file $f --jsonArray --drop
done
echo "Import complete!"
