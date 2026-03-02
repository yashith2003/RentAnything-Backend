//src/item/services/search-setup.service.ts

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SearchSetupService implements OnModuleInit {
  private readonly logger = new Logger(SearchSetupService.name);

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    await this.setupSearchInfrastructure();
  }

  private async setupSearchInfrastructure() {
    try {
      this.logger.log('Setting up search infrastructure (extensions, indices, and triggers)...');

      await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

      // Ensure search_vector exists (TypeORM might have created it, but let's be sure)
      await this.dataSource.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='items' AND column_name='search_vector') THEN
            ALTER TABLE items ADD COLUMN search_vector tsvector;
          END IF;
        END $$;
      `);

      // Create GIN indices
      await this.dataSource.query(`CREATE INDEX IF NOT EXISTS items_search_vector_idx ON items USING GIN (search_vector);`);
      await this.dataSource.query(`CREATE INDEX IF NOT EXISTS items_title_trgm_idx ON items USING GIN (title gin_trgm_ops);`);

      // Create Trigger Function
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION trigger_update_item_search_vector() RETURNS trigger AS $$
        DECLARE
            v_brand_text text := '';
            v_model_text text := '';
            v_specs_text text := '';
        BEGIN
            IF (TG_TABLE_NAME = 'items') THEN
                -- Fetch details from related tables
                -- Electronics
                SELECT brand, model, specifications INTO v_brand_text, v_model_text, v_specs_text 
                FROM electronics_details WHERE item_id = NEW.id;
                
                -- Vehicle
                IF v_brand_text IS NULL OR v_brand_text = '' THEN
                    SELECT vehicle_type || ' ' || fuel_type, '', '' INTO v_brand_text, v_model_text, v_specs_text 
                    FROM vehicle_details WHERE item_id = NEW.id;
                END IF;

                -- Fashion
                IF v_brand_text IS NULL OR v_brand_text = '' THEN
                    SELECT brand, '', material INTO v_brand_text, v_model_text, v_specs_text 
                    FROM fashion_details WHERE item_id = NEW.id;
                END IF;

                -- Home
                IF v_brand_text IS NULL OR v_brand_text = '' THEN
                    SELECT property_type, '', '' INTO v_brand_text, v_model_text, v_specs_text 
                    FROM home_details WHERE item_id = NEW.id;
                END IF;

                -- Sports
                IF v_brand_text IS NULL OR v_brand_text = '' THEN
                    SELECT sport_type || ' ' || equipment_type, '', '' INTO v_brand_text, v_model_text, v_specs_text 
                    FROM sports_details WHERE item_id = NEW.id;
                END IF;

                NEW.search_vector := 
                    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(v_brand_text, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(v_model_text, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(NEW.description, '') || ' ' || coalesce(v_specs_text, '')), 'D');
            ELSE
                -- For detail tables, we update the parent item's updated_at
                -- This will fire the BEFORE trigger on the items table, which will calculate the vector
                UPDATE items SET updated_at = now() WHERE id = NEW.item_id;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Create Triggers
      const detailTables = ['electronics_details', 'vehicle_details', 'fashion_details', 'home_details', 'sports_details'];
      
      // Items Trigger (BEFORE INSERT/UPDATE)
      await this.dataSource.query(`DROP TRIGGER IF EXISTS trg_items_search_vector ON items;`);
      await this.dataSource.query(`
        CREATE TRIGGER trg_items_search_vector BEFORE INSERT OR UPDATE OF title, description, updated_at ON items 
        FOR EACH ROW EXECUTE FUNCTION trigger_update_item_search_vector();
      `);

      // Details Triggers (AFTER INSERT/UPDATE)
      for (const table of detailTables) {
          const triggerName = `trg_${table}_search_vector`;
          await this.dataSource.query(`DROP TRIGGER IF EXISTS ${triggerName} ON ${table};`);
          await this.dataSource.query(`
            CREATE TRIGGER ${triggerName} AFTER INSERT OR UPDATE ON ${table} 
            FOR EACH ROW EXECUTE FUNCTION trigger_update_item_search_vector();
          `);
      }

      // Populate existing items
      await this.dataSource.query(`UPDATE items SET updated_at = now() WHERE search_vector IS NULL;`);

      this.logger.log('Search infrastructure setup complete.');
    } catch (error) {
      this.logger.error('Failed to setup search infrastructure:', error);
    }
  }
}
