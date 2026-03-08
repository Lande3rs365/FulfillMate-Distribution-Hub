/**
 * Generate SQL insert statements for v5 products
 */
import { describe, it } from 'vitest';
import { parseSkuFrameworkXlsx, resolveParentSku } from '@/lib/skuFrameworkParser';
import * as fs from 'fs';
import * as path from 'path';

function escapeSql(s: string | null): string {
  if (s === null) return 'NULL';
  return `'${s.replace(/'/g, "''")}'`;
}

describe('Generate SQL', () => {
  it('outputs insert statements', () => {
    const filePath = path.resolve(__dirname, '../../assets/JFlowers_SKU_Framework_v5.xlsx');
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = new Uint8Array(buffer).buffer;
    const products = parseSkuFrameworkXlsx(arrayBuffer);
    const companyId = '9215d6c9-585d-4e87-a5b0-30209ef62c9a';
    
    // Pass 1: parents and standalones
    const parents = products.filter(p => p.row_type === 'parent' || p.row_type === 'standalone');
    const variants = products.filter(p => p.row_type === 'variant');
    
    // Generate parent inserts in batches of 50
    const parentBatches: string[] = [];
    for (let i = 0; i < parents.length; i += 50) {
      const batch = parents.slice(i, i + 50);
      const values = batch.map(p => 
        `(${escapeSql(companyId)}, ${escapeSql(p.sku)}, ${escapeSql(p.name)}, ${escapeSql(p.category)}, ${escapeSql(p.row_type)}, ${escapeSql(p.description)})`
      ).join(',\n');
      parentBatches.push(`INSERT INTO products (company_id, sku, name, category, row_type, description) VALUES\n${values};`);
    }
    
    // Generate variant inserts - these need parent_product_id resolved after parent insert
    const variantValues = variants.map(v => {
      const parentSku = resolveParentSku(v.sku, v.category);
      const parentRef = parentSku 
        ? `(SELECT id FROM products WHERE sku = ${escapeSql(parentSku)} AND company_id = ${escapeSql(companyId)} LIMIT 1)`
        : 'NULL';
      return `(${escapeSql(companyId)}, ${escapeSql(v.sku)}, ${escapeSql(v.name)}, ${escapeSql(v.category)}, ${escapeSql(v.row_type)}, ${escapeSql(v.description)}, ${parentRef})`;
    });
    
    const variantBatches: string[] = [];
    for (let i = 0; i < variantValues.length; i += 30) {
      const batch = variantValues.slice(i, i + 30);
      variantBatches.push(`INSERT INTO products (company_id, sku, name, category, row_type, description, parent_product_id) VALUES\n${batch.join(',\n')};`);
    }
    
    // Write all SQL
    const allSql = [...parentBatches, ...variantBatches].join('\n\n');
    fs.writeFileSync(path.resolve(__dirname, '../../assets/v5_inserts.sql'), allSql);
    
    console.log(`Generated ${parentBatches.length} parent batches, ${variantBatches.length} variant batches`);
    console.log(`Parents: ${parents.length}, Variants: ${variants.length}`);
    
    // Also write individual batch files for execution
    const allBatches = [...parentBatches, ...variantBatches];
    for (let i = 0; i < allBatches.length; i++) {
      fs.writeFileSync(path.resolve(__dirname, `../../assets/batch_${i}.sql`), allBatches[i]);
    }
    console.log(`Wrote ${allBatches.length} batch files`);
  });
});
