const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");

const port = 3001;

const pool = mysql.createPool({
  	host: "49.50.172.42",
  	port: "3306",
  	user: "server",
  	password: "tlstkddn!",
  	database: "dksl_live",
	connectionLimit: 10
});

app.use(cors());

app.get("/getPlayerStat/:playerId", (req, res) => {
	
	var playerId = req.params.playerId;

	pool.getConnection((err, conn) => {

		if (err){
			res.send(err);
			conn.release();
		}
		else {
			conn.query("SELECT * from batter_stat where playerId = " + playerId, function(e, r, f){

				var batter_stat = {
					total : {},
					yearly : []
				};

        			for (i in r[0]){
					batter_stat.total[i] = 0;
				}

        			for (i in r){

          				batter_stat.yearly.push(r[i]);
					
          				for (j in r[i]){
            					switch(j){
              						case "playerId": case "year": 
              						case "AVG": case "OBP": case "SLG": case "OPS": break;
              						default: batter_stat.total[j] += r[i][j];
            					}
          				}

        			}

        			batter_stat.total["AVG"] = batter_stat.total["H"] / batter_stat.total["AB"];
        			batter_stat.total["OBP"] = (batter_stat.total["H"] + batter_stat.total["BB"] + batter_stat.total["HBP"]) / batter_stat.total["PA"];
        			batter_stat.total["SLG"] = batter_stat.total["TB"] / batter_stat.total["AB"];
        			batter_stat.total["OPS"] = batter_stat.total["OBP"] + batter_stat.total["SLG"];

       				console.log(batter_stat);
				res.send(batter_stat);
				conn.release();				

			});

		}			

	});

});

app.get("/getTeamPlayers/:teamId", (req, res) => {

	var teamId = req.params.teamId;

	pool.getConnection((err, conn) => {

		if (err) {
			res.send(err);
			conn.relaese();
		}
		else {
			conn.query("SELECT * from player_info where teamId = " + teamId, (e, r, f) => {
				if (err) {
					res.send(err);
          conn.release();
				}	
				else {
					res.send(r);
          conn.release();
				}
			});
		}

	});
		
});

app.get("/getLeagueTeams/:leagueId", (req, res) => {

	var leagueId = req.params.leagueId;

        pool.getConnection((err, conn) => {

                if (err) {
                        res.send(err);
                        conn.relaese();
                }
                else {
                        conn.query("SELECT * from team_info where leagueId = " + leagueId, (e, r, f) => {
                                if (err) {
                                        res.send(err);
                                        conn.release();
                                }
                                else {
                                        res.send(r);
                                        conn.release();
                                }
                        });
                }

        });

});

app.get("/getLeagues", (req, res) => {

        pool.getConnection((err, conn) => {

                if (err) {
                        res.send(err);
                        conn.relaese();
                }
                else {
                        conn.query("SELECT * from league_info", (e, r, f) => {
                                if (err) {
                                        res.send(err);
                                        conn.release();
                                }
                                else {
                                        res.send(r);
                                        conn.release();
                                }
                        });
                }

        });


});

app.listen(port, () => console.log("on " + port));
