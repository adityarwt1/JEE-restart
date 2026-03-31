#!/bin/bash

# Extract URLs for imageIds (baseUrl + key)
imageid_urls=$(grep '"key":' test.json | sed 's/.*"key": "\([^"]*\)".*/https:\/\/static.pw.live\/\1/')

# Extract URLs for solution images
solution_urls=$(grep '"image": "https' test.json | sed 's/.*"image": "\([^"]*\)".*/\1/')

# Combine and remove duplicates
all_urls=$(echo -e "$imageid_urls\n$solution_urls" | sort | uniq)

# Download each URL
echo "$all_urls" | while read -r url; do
    if [ -n "$url" ]; then
        filename=$(basename "$url")
        echo "Downloading $url to $filename"
        curl -L -o "$filename" "$url"
    fi
done

echo "All downloads complete."