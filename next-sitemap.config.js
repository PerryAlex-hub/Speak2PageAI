/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://speak2page.app', // Your website URL
  generateRobotsTxt: true,           // Generate robots.txt file automatically
  sitemapSize: 5000,                  // Split sitemaps if you have many pages
  changefreq: 'daily',                // Optional: set change frequency
  priority: 0.7,                      // Optional: page priority
};
