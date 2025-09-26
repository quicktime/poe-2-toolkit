#!/usr/bin/env ts-node
/**
 * Scraper for PoE2DB.tw - Gets actual PoE 2 v0.3 data
 * Alternative to GGPK extraction
 */

import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.join(__dirname, 'poe2db_data');

// PoE2DB URLs for different data types
const POE2DB_URLS = {
  // Items
  baseItems: 'https://poe2db.tw/us/BaseItemTypes',
  uniqueItems: 'https://poe2db.tw/us/UniqueItems',

  // Skills
  activeSkills: 'https://poe2db.tw/us/ActiveSkills',
  supportGems: 'https://poe2db.tw/us/SupportGems',

  // Passive Tree
  passiveSkills: 'https://poe2db.tw/us/PassiveSkills',

  // Mods
  mods: 'https://poe2db.tw/us/Mods',

  // Currency
  currency: 'https://poe2db.tw/us/Currency'
};

interface ScrapedItem {
  name: string;
  base?: string;
  level?: number;
  stats?: string[];
  mods?: string[];
  requirements?: {
    level?: number;
    str?: number;
    dex?: number;
    int?: number;
  };
}

class Poe2DbScraper {
  private browser: puppeteer.Browser | null = null;

  async init(): Promise<void> {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Scrape a page and extract table data
   */
  async scrapePage(url: string, dataType: string): Promise<any[]> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    console.log(`📄 Scraping ${dataType} from: ${url}`);
    const page = await this.browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      // Wait for table to load
      await page.waitForSelector('table', { timeout: 10000 });

      // Extract data based on page type
      const data = await page.evaluate((type) => {
        const extractTableData = () => {
          const rows = document.querySelectorAll('table tbody tr');
          const data: any[] = [];

          rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length === 0) return;

            const item: any = {};

            // Extract based on data type
            switch (type) {
              case 'baseItems':
                item.name = cells[0]?.textContent?.trim();
                item.itemClass = cells[1]?.textContent?.trim();
                item.dropLevel = parseInt(cells[2]?.textContent || '0');
                item.width = parseInt(cells[3]?.textContent || '1');
                item.height = parseInt(cells[4]?.textContent || '1');
                break;

              case 'uniqueItems':
                item.name = cells[0]?.textContent?.trim();
                item.baseName = cells[1]?.textContent?.trim();
                item.level = parseInt(cells[2]?.textContent || '0');
                // Extract mods from tooltip or details
                const modElements = row.querySelectorAll('.item-mod');
                item.mods = Array.from(modElements).map(el => el.textContent?.trim());
                break;

              case 'activeSkills':
                item.name = cells[0]?.textContent?.trim();
                item.tags = cells[1]?.textContent?.trim()?.split(', ');
                item.level = parseInt(cells[2]?.textContent || '1');
                item.manaCost = cells[3]?.textContent?.trim();
                item.castTime = cells[4]?.textContent?.trim();
                item.damageEffectiveness = cells[5]?.textContent?.trim();
                break;

              case 'passiveSkills':
                item.id = cells[0]?.textContent?.trim();
                item.name = cells[1]?.textContent?.trim();
                item.stats = cells[2]?.textContent?.trim()?.split('\n');
                item.isNotable = cells[3]?.textContent?.includes('Notable');
                item.isKeystone = cells[3]?.textContent?.includes('Keystone');
                break;

              default:
                // Generic extraction
                cells.forEach((cell, index) => {
                  item[`col${index}`] = cell.textContent?.trim();
                });
            }

            if (item.name) {
              data.push(item);
            }
          });

          return data;
        };

        return extractTableData();
      }, dataType);

      console.log(`  ✅ Scraped ${data.length} items`);
      return data;

    } catch (error) {
      console.error(`  ❌ Error scraping ${dataType}:`, error);
      return [];
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape detailed item page
   */
  async scrapeItemDetails(itemUrl: string): Promise<ScrapedItem | null> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();

    try {
      await page.goto(itemUrl, { waitUntil: 'networkidle2' });

      const itemData = await page.evaluate(() => {
        const item: any = {};

        // Extract name
        item.name = document.querySelector('h1')?.textContent?.trim();

        // Extract stats
        const statElements = document.querySelectorAll('.item-stat');
        item.stats = Array.from(statElements).map(el => el.textContent?.trim());

        // Extract mods
        const modElements = document.querySelectorAll('.item-mod');
        item.mods = Array.from(modElements).map(el => el.textContent?.trim());

        // Extract requirements
        const reqText = document.querySelector('.requirements')?.textContent;
        if (reqText) {
          const levelMatch = reqText.match(/Level: (\d+)/);
          const strMatch = reqText.match(/Str: (\d+)/);
          const dexMatch = reqText.match(/Dex: (\d+)/);
          const intMatch = reqText.match(/Int: (\d+)/);

          item.requirements = {
            level: levelMatch ? parseInt(levelMatch[1]) : undefined,
            str: strMatch ? parseInt(strMatch[1]) : undefined,
            dex: dexMatch ? parseInt(dexMatch[1]) : undefined,
            int: intMatch ? parseInt(intMatch[1]) : undefined
          };
        }

        return item;
      });

      return itemData as ScrapedItem;

    } catch (error) {
      console.error('Error scraping item details:', error);
      return null;
    } finally {
      await page.close();
    }
  }
}

/**
 * Save scraped data to JSON
 */
async function saveData(filename: string, data: any): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  console.log(`  💾 Saved to: ${filename}`);
}

/**
 * Main scraping function
 */
async function main(): Promise<void> {
  console.log('=' .repeat(60));
  console.log('PoE2DB.tw Scraper for Path of Exile 2 v0.3');
  console.log('=' .repeat(60));

  const scraper = new Poe2DbScraper();

  try {
    await scraper.init();

    // Scrape each data type
    for (const [dataType, url] of Object.entries(POE2DB_URLS)) {
      const data = await scraper.scrapePage(url, dataType);

      if (data.length > 0) {
        await saveData(`${dataType}.json`, data);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Scraping complete!');
    console.log(`📁 Data saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Scraping failed:', error);
  } finally {
    await scraper.close();
  }
}

// Alternative: Use static JSON exports
async function useStaticExports(): Promise<void> {
  console.log('\n📦 Using Static Data Exports...');

  // Many community members maintain static exports
  const staticDataUrls = {
    // Path of Building Community data
    pobItems: 'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Data/Uniques.lua',
    pobBases: 'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Data/Bases.lua',
    pobGems: 'https://raw.githubusercontent.com/PathOfBuildingCommunity/PathOfBuilding/master/src/Data/Skills.lua',

    // Exile Leveling data
    exileLevelingItems: 'https://raw.githubusercontent.com/exile-leveling/exile-leveling/main/data/items.json',
    exileLevelingGems: 'https://raw.githubusercontent.com/exile-leveling/exile-leveling/main/data/gems.json'
  };

  console.log('Note: These URLs provide PoE 1 data.');
  console.log('For PoE 2 v0.3 data, manual extraction or web scraping is required.');
}

// Run if executed directly
if (require.main === module) {
  // Check for puppeteer
  try {
    require('puppeteer');
    main();
  } catch {
    console.error('Please install puppeteer: npm install puppeteer');
    console.log('\nAlternatively, using static data exports...');
    useStaticExports();
  }
}