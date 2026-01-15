# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5]

### Performance
- Optimized memory usage in dashboard data loading

### Fixed
- Fixed misc. Typescript errors

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
- Fixed leaderboard not displaying correctly (order)
- Fixed timezone display inconsistencies
- Resolved issues with player stat refresh scheduling

## [1.0.1] 

### Added
- Dark mode support
- GitHub and portfolio links in navigation
- Responsive design improvements

### Fixed
- Fixed Laravel default configuration issues
- Fixed pie graph incorrectly displaying data
- Various responsive layout adjustments

## [1.0.0] 

### Added
- Initial release of Archeio
- Player statistics tracking
- Dashboard with customizable drag-and-drop components
- XP over time charts (line and bar charts)
- Activity tracking for level gains and XP milestones
- Auto-refresh functionality for player stats
- Multi-player support
- Integration with OSRS Hiscores API
- User authentication and authorization
- Player management via Artisan commands
- Legacy data import functionality
- API endpoints for player data access


