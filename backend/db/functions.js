
/*const findUser=(email)=>{
    return false;
}*/
async function newAccount(name,age,gender){
    const result=await pool.query(
        'INSERT INTO USERS(name,age,gender) values ($1,$2,$3) returning *',[name,age,gender]
    );
    console.log(result.rows[0])
}





module.exports={newAccount}