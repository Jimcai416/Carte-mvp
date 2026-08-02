-- Tavue beta event volume and unique installations, last 7 days.
SELECT
  blob1 AS event,
  SUM(_sample_interval) AS event_count,
  COUNT(DISTINCT index1) AS unique_installations
FROM carte_beta_events
WHERE timestamp > NOW() - INTERVAL '7' DAY
GROUP BY event
ORDER BY event_count DESC;

-- Client-observed scan success rate and average duration, last 7 days.
SELECT
  blob1 AS event,
  SUM(_sample_interval) AS scans,
  AVG(double2) AS average_duration_ms
FROM carte_beta_events
WHERE timestamp > NOW() - INTERVAL '7' DAY
  AND blob1 IN ('scan_completed', 'scan_failed')
GROUP BY event;

-- Scan failures grouped by safe error code.
SELECT
  blob5 AS error_code,
  SUM(_sample_interval) AS failures
FROM carte_beta_events
WHERE timestamp > NOW() - INTERVAL '7' DAY
  AND blob1 IN ('scan_failed', 'scan_api_failed', 'scan_api_rate_limited')
GROUP BY error_code
ORDER BY failures DESC;

-- Camera versus photo-library completion.
SELECT
  blob4 AS source,
  SUM(_sample_interval) AS completed_scans,
  AVG(double2) AS average_duration_ms,
  AVG(double3) AS average_dish_count
FROM carte_beta_events
WHERE timestamp > NOW() - INTERVAL '7' DAY
  AND blob1 = 'scan_completed'
GROUP BY source;
