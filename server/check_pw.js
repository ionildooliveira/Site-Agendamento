const bcrypt = require('bcryptjs');

const hash = "$2a$10$rSzFwqAnaR1iHU6j6R4OZ.y876lAltUFxbaReTtPlpT/A7mEkxj1e";
const pw1 = "Soifdx29@";
const pw2 = "Soifdx29@ ";

console.log("pw1 matches?", bcrypt.compareSync(pw1, hash));
console.log("pw2 matches?", bcrypt.compareSync(pw2, hash));
