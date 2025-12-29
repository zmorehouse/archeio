# OSRS Player Stats Dashboard

A dashboard for tracking Old School RuneScape player statistics. Built with Laravel, React, and Inertia.js.

## Features

- **Real-time Player Stats** - Track XP, levels, and skill progress
- **XP Over Time Charts** - Visualize XP gains with line and bar charts
- **Activity Tracking** - Monitor level gains, XP milestones, and achievements
- **Auto-refresh** - Automatically fetch latest stats from RuneScape API
- **Multi-player Support** - Track multiple players simultaneously
- **Customizable Dashboard** - Drag-and-drop component layout

## Tech Stack

- **Backend**: Laravel 12, PHP 8.2+
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Framework**: Inertia.js
- **Database**: SQLite 
- **Build Tool**: Vite

## Prerequisites

Before you begin, ensure you have:

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- Git

## Quick Start

### 1. Fork This Repository

Click the "Fork" button at the top of this repository to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/osrs-v2.git
cd osrs-v2
```

### 3. Install Dependencies

```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### 4. Environment Setup

```bash
# Copy the environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 5. Configure Environment Variables

Edit `.env` and set:

```env
APP_NAME="Your OSRS Dashboard"
APP_URL=http://localhost:8000

# Database (SQLite is default)
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Or use MySQL for production
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=osrs_dashboard
# DB_USERNAME=your_username
# DB_PASSWORD=your_password
```

### 6. Run Migrations

```bash
php artisan migrate
```

### 7. Build Frontend Assets

```bash
# For development
npm run dev

# For production
npm run build
```

### 8. Start Development Server

```bash
php artisan serve
```

## Adding Players

### Via Artisan Command

```bash
php artisan players:add "PlayerName1" "PlayerName2"
```

### Fetching Player Stats

Stats are automatically fetched, but you can manually trigger:

```bash
# Fetch stats for all players
php artisan players:fetch-stats

# Or use the API endpoint
POST /api/v1/players/refresh
```

## Deployment

### Laravel Cloud

Laravel Cloud is the easiest way to deploy Laravel applications:

1. **Sign up** at [cloud.laravel.com](https://cloud.laravel.com)
2. **Create a new project** and connect your GitHub repository
3. **Configure environment variables** in the Laravel Cloud dashboard:
   - `APP_NAME`
   - `APP_URL` (your cloud domain)
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - Database credentials (MySQL provided by Laravel Cloud)
4. **Deploy**

**Note**: Make sure to enabled scheduled tasks on your environment.

### Traditional Hosting (VPS/Shared Hosting)

#### Requirements

- PHP 8.2+ with extensions: `pdo`, `pdo_sqlite`, `mbstring`, `xml`, `curl`, `json`
- Composer
- Node.js 18+ and npm
- Web server (Apache/Nginx)

#### Deployment Steps

1. **Upload your code** to your server (via Git, FTP, or SCP)

2. **Install dependencies**:
```bash
composer install --optimize-autoloader --no-dev
npm install
npm run build
```

3. **Set up environment**:
```bash
cp .env.example .env
php artisan key:generate
```

4. **Configure `.env`**:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Use MySQL for production
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

5. **Run migrations**:
```bash
php artisan migrate --force
```

6. **Set up web server**:
   - Point document root to `/public`
   - Configure URL rewriting for Laravel

7. **Set up cron job** (for automatic stat fetching):
```bash
# Add to crontab (crontab -e)
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

8. **Set up queue worker** (optional, for background jobs):
```bash
php artisan queue:work
```

## Customization

### Changing Skill Icons

Skill icons are located in `public/images/skills/`. Replace PNG files with your own (24x24px recommended).

### Styling

The app uses Tailwind CSS. Customize colors and styles in:
- `resources/css/app.css`
- Component-level Tailwind classes

### Adding New Components

1. Create component in `resources/js/components/dashboard/`
2. Register in `resources/js/lib/component-registry.ts`
3. Add to `resources/js/components/dashboard/component-renderer.tsx`

## API Endpoints

- `GET /api/v1/players` - List all players
- `GET /api/v1/players/{player}` - Get player details
- `GET /api/v1/players/{player}/stats` - Get player stats
- `POST /api/v1/players/refresh` - Manually refresh all player stats

## License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## Credits

- Built with [Laravel](https://laravel.com)
- Frontend powered by [React](https://react.dev) and [Inertia.js](https://inertiajs.com)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Data from [RuneScape Official Hiscores](https://secure.runescape.com/m=hiscore_oldschool)
