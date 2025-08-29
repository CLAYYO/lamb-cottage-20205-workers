// URL and preview mode debug test
console.log('=== URL Debug Test ===');
console.log('Current URL:', window.location.href);
console.log('Search params:', window.location.search);
console.log('URLSearchParams:', new URLSearchParams(window.location.search));
console.log('Has preview param:', new URLSearchParams(window.location.search).has('preview'));
console.log('Preview param value:', new URLSearchParams(window.location.search).get('preview'));
console.log('Includes preview=true:', window.location.search.includes('preview=true'));
console.log('=== URL Debug Complete ===');