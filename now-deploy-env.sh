#!/bin/sh

sed 's/\(.*\)=\(.*\)/-e \1=\"\2\" /' .env | xargs now --npm
