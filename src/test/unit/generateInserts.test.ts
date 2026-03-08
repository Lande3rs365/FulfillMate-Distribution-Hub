/**
 * One-time script to generate SQL INSERT for v5 products.
 * Run with: npx vitest run src/test/unit/generateInserts.test.ts
 */
import { describe, it } from 'vitest';
import { parseSkuFrameworkXlsx, resolveParentSku } from '@/lib/skuFrameworkParser';
import * as fs from 'fs';
import * as path from 'path';

describe('Generate insert SQL', () => {
  it('outputs products JSON', () => {
    const filePath = path.resolve(__dirname, '../../assets/JFlowers_SKU_Framework_v5.xlsx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = new Uint8Array(buffer).buffer;
    const products = parseSkuFrameworkXlsx(arrayBuffer);
    
    // Output as JSON for review
    const output = products.map(p => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      row_type: p.row_type,
      description: p.description,
    }));
    
    fs.writeFileSync(
      path.resolve(__dirname, '../../assets/v5_products.json'),
      JSON.stringify(output, null, 2)
    );
    
    console.log(`Wrote ${output.length} products to v5_products.json`);
  });
});
