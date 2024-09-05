
const { Pool } = require('pg'); 
const pool = new Pool({
  user: 'postgres',           
  host: 'localhost',         
  database: 'node_server',   
  password: '123',           
  port: 5432,    
});


module.exports = pool;
