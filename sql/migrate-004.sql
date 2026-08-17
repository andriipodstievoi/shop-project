-- Migration 004: a media gallery per product (several photos and video).
--
-- Run ONCE against an existing installation. A fresh install gets this from
-- schema.sql / schema-hosted.sql instead.
--
-- On shared hosting: phpMyAdmin -> select your database -> SQL tab -> paste.
-- Adds one column; no existing row is changed.

-- JSON array of {type, url}, where type is image, video or youtube. A row per
-- media item would be tidier in theory, but the gallery is always read and
-- written as one whole list, and this keeps the admin form to a single field.
-- image_url stays as the single thumbnail used by the catalog cards.
ALTER TABLE products ADD COLUMN media TEXT NULL AFTER image_url;
