import { governanceHandlers } from './lib/tools/handlers-governance.js';

console.log('Testing governance handler directly...');
governanceHandlers.get_governance_constitution()
  .then(result => {
    console.log('SUCCESS:');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('ERROR:');
    console.error(error);
  });
