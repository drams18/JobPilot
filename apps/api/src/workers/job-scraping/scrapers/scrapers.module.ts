import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LinkedInScraper } from './linkedin.scraper';

@Module({
  imports: [ConfigModule],
  providers: [LinkedInScraper],
  exports: [LinkedInScraper],
})
export class ScrapersModule {}
