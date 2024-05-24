SELECT id from reviews ORDER BY id DESCINSERT INTO reviews (
    id,
    app_id,
    app_name,
    review_text,
    review_score,
    review_votes
  )
VALUES (
    id:integer,
    'app_id:bigint',
    'app_name:text',
    'review_text:text',
    review_score:integer,
    review_votes:integer
  );