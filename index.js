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

      conn.query("SELECT player_info.teamId, player_info.playerPhoto, player_info.playerName, player_info.wasPro, player_info.Bat_Throw, player_info.backNum, player_info.position, player_info.birthday , batter_stat.* from player_info left join batter_stat using(playerId) where player_info.playerId = " + playerId, function(e, r, f){

        if (r.length == 0){
          res.send(undefined);
        }
        else {
          var player_info = {
            teamId : r[0].teamId,
            playerPhoto : r[0].playerPhoto,
            playerName : r[0].playerName,
            wasPro : r[0].wasPro,
            position : r[0].position,
            birthday : r[0].birthday,
            Bat_Throw : r[0].Bat_Throw,
            backNum : r[0].backNum
          };

          var batter_stat = {
            total : {},
            yearly : []
          };

          for (i in r[0]){
            if (!(i in player_info)){
              batter_stat.total[i] = 0;
            }
          }

          for (i in r){

            for (j in r[i]){
              if (j in player_info){
                delete r[i][j];
              }
            }

            batter_stat.yearly.push(r[i]);

            for (j in r[i]){
              switch(j){
                case "playerId": case "year": 
                case "AVG": case "OBP": case "SLG": case "OPS": break;
                default: 
                  if (!(j in player_info))
                    batter_stat.total[j] += r[i][j];
              }
            }

          }

          batter_stat.total["AVG"] = batter_stat.total["H"] / batter_stat.total["AB"];
          batter_stat.total["OBP"] = (batter_stat.total["H"] + batter_stat.total["BB"] + batter_stat.total["HBP"]) / batter_stat.total["PA"];
          batter_stat.total["SLG"] = batter_stat.total["TB"] / batter_stat.total["AB"];
          batter_stat.total["OPS"] = batter_stat.total["OBP"] + batter_stat.total["SLG"];

          var result = {
            player_info : player_info,
            batter_stat : batter_stat
          };

          if (r[0].year == null){
            result.batter_stat.yearly = [];
          }

          res.send(result);   
        }    

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

app.get("/getTeamInfo/:teamId", (req, res) => {

  var teamId = req.params.teamId;

  pool.getConnection((err, conn) => {

    if (err) {
      res.send(err);
      conn.relaese();
    }
    else {
      conn.query("SELECT * from team_info where teamId = " + teamId, (e, r, f) => {
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