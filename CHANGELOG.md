# Changelog

All notable changes to this project will be documented in this file.

## [1.0.8]

### Performance
- Implemented deferred props for historical stats to prevent memory exhaustion errors
  - Dashboard and player pages now load historical stats asynchronously after initial render

### Fixed
- Fixed memory exhaustion errors 
- Removed automatic force refresh on dashboard page load

## [1.0.7]

### Added
- Boss kills distribution pie charts for dashboard and individual player pages
  - Shows percentage breakdown of all boss kills
  - Supports both pie and bar chart views
  - Aggregates boss kills across all players on dashboard view

### Performance
- Implemented progressive downsampling for historical stats to reduce memory usage
  - Last 14 days: Keep all records (full resolution for activity detection)
  - 14-30 days: Keep every 2nd record (50% reduction)
  - 30-90 days: Keep every 4th record (75% reduction)
  
- Optimized activities data in historical stats
  - Only include boss-related activities (filtered from all activities)
  - Activities only included for recent stats (last 14 days)
  - Significantly reduces memory usage while preserving boss kill detection functionality

## [1.0.6]

### Performance
- Continued optimizing data caching and query performance

### Fixed
- Fixed monthly and 6-month views not working correctly in XP over time charts

## [1.0.5]

### Added
- Laravel Nightwatch integration for browser testing

### Performance
- Optimized memory usage in dashboard data loading
- Improved query performance for player statistics

### Fixed
- Fixed various TypeScript type errors and warnings

## [1.0.4]

### Added
- Boss kills now appear in the activity overview (displayed in red with sword icon)
- Boss kill notifications show condensed format (e.g., "killed Zulrah 4 times") when multiple kills are detected between stat updates

### Changed
- Exp over time graph hover tooltips now show the player's average over the entire selected period instead of just the node value
  - Daily view: shows average exp/hr across all periods
  - Weekly/Monthly/6 Month views: shows average exp/day across all periods

## [1.0.3]

### Added
- Changelog dialog accessible from main menu (next to GitHub and portfolio links)
- Automatic version number extraction from changelog for app logo

### Fixed
- Fixed pie chart not displaying correctly when only one skill is at 100%
- Fixed height jumping when switching between daily/weekly/monthly periods with no data
- Improved pie chart display for single skill at 100% with centered icon and text

## [1.0.2]

### Fixed
- Fixed leaderboard not displaying players in correct order
- Fixed timezone display inconsistencies across the application
- Resolved issues with player stat refresh scheduling and timing

## [1.0.1]

### Added
- Dark mode support with system preference detection
- GitHub and portfolio links in navigation menu
- Responsive design improvements for mobile and tablet devices

### Fixed
- Fixed Laravel default configuration issues
- Fixed pie chart incorrectly displaying data and percentages
- Various responsive layout adjustments and improvements

## [1.0.0]

### Added
- Initial release of Archeio
- Player statistics tracking and monitoring
- Dashboard with customizable drag-and-drop component layout
- XP over time charts with line and bar chart views
- Activity tracking for level gains and XP milestones
- Auto-refresh functionality for player statistics
- Multi-player support and management
- Integration with OSRS Hiscores API
- User authentication and authorization system
- Player management via Artisan commands
- Legacy data import functionality
- API endpoints for player data access