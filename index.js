const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get("/test/:Id", (req, res) => {

  var Id = req.params.Id;

  pool.getConnection((err, conn) => {

    conn.query("select * from batter_stat left join pitcher_stat using(playerId) where batter_stat.playerId = " + Id, function(e, r, f){
      console.log(r);
    });

  });

});

// Player 관련
app.get("/getPlayerStat/:playerId", (req, res) => {
  
  var playerId = req.params.playerId;

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn.release();
    }
    else {

      conn.query("select team_info.teamName, player_info.playerPhoto, player_info.playerName, player_info.wasPro, player_info.position, player_info.birthday, player_info.Bat_Throw, player_info.backNum, batter_stat.* from team_info join player_info using(teamId) left join batter_stat using(playerId) where player_info.playerId = " + playerId, function(e, r, f){

        if (r.length == 0){
          res.send(undefined);
        }
        else {

          console.log(r);

          var player_info = {
            teamName : r[0].teamName,
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
                case "AVG": case "OBP": case "SLG": case "OPS": case "BABIP": break;
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
          if ((batter_stat.total["AB"]-batter_stat.total["SO"]-batter_stat.total["HR"]+batter_stat.total["SF"]) > 0)
            batter_stat.total["BABIP"] = (batter_stat.total["H"]-batter_stat.total["HR"])/(batter_stat.total["AB"]-batter_stat.total["SO"]-batter_stat.total["HR"]+batter_stat.total["SF"]);

          if (r[0].year == null){
            batter_stat.yearly = [];
          }

          conn.query("select * from pitcher_stat where playerId = " + playerId, function (e, r, f){

            var pitcher_stat = {
              total : {},
              yearly : []
            }

            for (i in r[0]){
              if (!(i in player_info)){
                pitcher_stat.total[i] = 0;
              }
            }

            for (i in r){

              for (j in r[i]){
                if (j in player_info){
                  delete r[i][j];
                }
              }

              pitcher_stat.yearly.push(r[i]);

              for (j in r[i]){
                switch(j){
                  case "playerId": case "year": 
                  case "ERA": break;
                  default: 
                    if (!(j in player_info))
                      pitcher_stat.total[j] += r[i][j];
                }
              }

            }

            pitcher_stat.total.ERA = (pitcher_stat.total.ER * 9) / (pitcher_stat.total.IP / 3);
            pitcher_stat.total.IP = parseInt(pitcher_stat.total.IP / 3) + ((pitcher_stat.total.IP % 3) * 0.1);

            for (i in pitcher_stat.yearly){
              pitcher_stat.yearly[i].IP = parseInt(pitcher_stat.yearly[i].IP / 3) + ((pitcher_stat.yearly[i].IP % 3) * 0.1);
            }

            var result = {
              player_info : player_info,
              batter_stat : batter_stat,
              pitcher_stat : pitcher_stat
            };

            res.send(result);

          });
   
        }    

        conn.release();

      });

    }     

  });

});

app.get("/getPlayerInfoByName/:playerName", (req, res) => {

  var playerName = req.params.playerName;

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn,release();
    }
    else {

      conn.query("SELECT player_info.*, team_info.teamName from player_info join team_info using(teamId) where playerName like \"%" + playerName + "%\" ORDER BY player_info.playerName", (e, r, f) => {

        if (err){
          res.send(err);
          conn.release();
        }
        else{
          res.send(r);
          conn.release();
        }

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

app.get("/getAllPlayerInfo", (req, res) => {

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn.release();
    }
    else{

      conn.query("SELECT player_info.*, team_info.teamName from player_info join team_info using(teamId) ORDER BY player_info.playerName", (e, r, f) => {

        if (err){
          res.send(err);
          conn.release();
        }
        else{
          res.send(r);
          conn.release();
        }

      });

    }

  });

});

app.get("/getAllPlayerBatterStat", (req, res) => {

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn.release();
    }
    else {

      conn.query("SELECT player_info.playerName, player_info.playerId, team_info.teamName, team_info.teamId, batter_stat.* from player_info join team_info using(teamId) join batter_stat using(playerId)", (e, r, f) => {

        var result = [];

        if (e){
          res.send(e);
          conn.release();
        }
        else{

          var result = {};

          result.total = []
          result.yearly = r.slice();
          
          for (i in r){

            var player = {};

            player.playerId = r[i].playerId;
            player.playerName = r[i].playerName;
            player.teamName = r[i].teamName;

            for (j in r) {
              if (player.playerId == r[j].playerId) {

                var tmp = r[j];
                r.splice(j*1, 1);

                for (k in tmp){
                  switch(k){
                    case "playerId": case "playerName": case "teamId": case "teamName": case "year": 
                    case "AVG": case "OBP": case "SLG": case "OPS": case "BABIP": 
                      break;
                    default:
                      if (player[k] == undefined){
                        player[k] = 0;
                      } 
                      player[k] += tmp[k];
                  }
                }
              }
            }

            player["AVG"] = player["H"] / player["AB"];
            player["OBP"] = (player["H"] + player["BB"] + player["HBP"]) / player["PA"];
            player["SLG"] = player["TB"] / player["AB"];
            player["OPS"] = player["OBP"] + player["SLG"];
            if ((player["AB"]-player["SO"]-player["HR"]+player["SF"]) > 0)
              player["BABIP"] = (player["H"]-player["HR"])/(player["AB"]-player["SO"]-player["HR"]+player["SF"]);


            result.total.push(player);

          }

          console.log(result.total.length);
          console.log(result.yearly.length);

          res.send(result);
          conn.release();
        }

      });

    }

  });

});

app.get("/getAllPlayerPitcherStat", (req, res) => {

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn.release();
    }
    else {

      conn.query("SELECT player_info.playerName, player_info.playerId, team_info.teamName, team_info.teamId, pitcher_stat.* from player_info join team_info using(teamId) join pitcher_stat using(playerId)", (e, r, f) => {

        if (e){
          res.send(e);
          conn.release();
        }
        else{

          var result = {};

          result.total = [];
          result.yearly = r.slice();
          
          for (i in r){

            var player = {};

            player.playerId = r[i].playerId;
            player.playerName = r[i].playerName;
            player.teamName = r[i].teamName;

            for (j in r){
              if (player.playerId == r[j].playerId){
                var tmp = r[j];
                r.splice(j*1, 1);

                for (k in tmp){
                  switch(k){
                    case "playerId": case "playerName": case "teamId": case "teamName": case "year": 
                    case "ERA": break;
                      break;
                    default:
                      if (player[k] == undefined){
                        player[k] = 0;
                      } 
                      player[k] += tmp[k];
                  }
                }

              }
            }

            player.ERA = (player.ER * 9) / (player.IP / 3);
            player.IP = parseInt(player.IP / 3) + ((player.IP % 3) * 0.1);

            result.total.push(player);

          }

          for (i in result.yearly){
            result.yearly[i].IP = parseInt(result.yearly[i].IP / 3) + ((result.yearly[i].IP % 3) * 0.1);
          }
          
          res.send(result);
          conn.release();
        }

      });

    }

  });

});

app.get("/getTeamPlayerBatterStat/:teamId", (req, res) => {

  var teamId = req.params.teamId;

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn.release();
    }
    else {

      conn.query("SELECT player_info.playerName, player_info.playerId, team_info.teamName, batter_stat.* from player_info join team_info using(teamId) join batter_stat using(playerId) where teamId = " + teamId, (e, r, f) => {

        if (e){
          res.send(e);
          conn.release();
        }
        else{

          var result = {};

          result.total = []
          result.yearly = r.slice();
          
          for (i in r){

            var player = {};

            player.playerId = r[i].playerId;
            player.playerName = r[i].playerName;
            player.teamName = r[i].teamName;

            for (j in r) {
              if (player.playerId == r[j].playerId) {

                var tmp = r[j];
                r.splice(j*1, 1);

                for (k in tmp){
                  switch(k){
                    case "playerId": case "playerName": case "teamId": case "teamName": case "year": 
                    case "AVG": case "OBP": case "SLG": case "OPS": case "BABIP": 
                      break;
                    default:
                      if (player[k] == undefined){
                        player[k] = 0;
                      } 
                      player[k] += tmp[k];
                  }
                }
              }
            }

            player["AVG"] = player["H"] / player["AB"];
            player["OBP"] = (player["H"] + player["BB"] + player["HBP"]) / player["PA"];
            player["SLG"] = player["TB"] / player["AB"];
            player["OPS"] = player["OBP"] + player["SLG"];
            if ((player["AB"]-player["SO"]-player["HR"]+player["SF"]) > 0)
              player["BABIP"] = (player["H"]-player["HR"])/(player["AB"]-player["SO"]-player["HR"]+player["SF"]);


            result.total.push(player);

          }

          console.log(result.total.length);
          console.log(result.yearly.length);

          res.send(result);
          conn.release();
        }

      });

    }

  });

});


app.get("/getTeamPlayerPitcherStat/:teamId", (req, res) => {

  var teamId = req.params.teamId;

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn.release();
    }
    else {

      conn.query("SELECT player_info.playerName, player_info.playerId, team_info.teamName, team_info.teamId, pitcher_stat.* from player_info join team_info using(teamId) join pitcher_stat using(playerId) where teamId = " + teamId , (e, r, f) => {

        if (e){
          res.send(e);
          conn.release();
        }
        else{

          var result = {};

          result.total = [];
          result.yearly = r.slice();
          
          for (i in r){

            var player = {};

            player.playerId = r[i].playerId;
            player.playerName = r[i].playerName;
            player.teamName = r[i].teamName;

            for (j in r){
              if (player.playerId == r[j].playerId){
                var tmp = r[j];
                r.splice(j*1, 1);

                for (k in tmp){
                  switch(k){
                    case "playerId": case "playerName": case "teamId": case "teamName": case "year": 
                    case "ERA": break;
                    default:
                      if (player[k] == undefined){
                        player[k] = 0;
                      } 
                      player[k] += tmp[k];
                  }
                }

              }
            }

            player.ERA = (player.ER * 9) / (player.IP / 3);
            player.IP = parseInt(player.IP / 3) + ((player.IP % 3) * 0.1);

            result.total.push(player);

          }

          for (i in result.yearly){
            result.yearly[i].IP = parseInt(result.yearly[i].IP / 3) + ((result.yearly[i].IP % 3) * 0.1);
          }
          
          res.send(result);
          conn.release();
        }

      });

    }

  });

});

// Team 관련
app.get("/getTeamInfo/:teamId", (req, res) => {

  var teamId = req.params.teamId;

  pool.getConnection((err, conn) => {

    if (err) {
      res.send(err);
      conn.release();
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

app.get("/getTeamInfoByName/:teamName", (req, res) => {

  var teamName = req.params.teamName;

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn,release();
    }
    else {

      conn.query("SELECT * from team_info where teamName like \"%" + teamName + "%\"", (e, r, f) => {

        if (err){
          res.send(err);
          conn.release();
        }
        else{
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


app.get("/getTeams", (req, res) => {

  pool.getConnection((err, conn) => {

    if (err){
      res.send(err);
      conn.release();
    }
    else{

      conn.query("SELECT team_info.teamId, team_info.teamName, league_info.leagueName from team_info join league_info using(leagueId)", (e, r, f) => {

        if (err){
          res.send(err);
          conn.release();
        }
        else{
          res.send(r);
          conn.release();
        }

      });

    }

  });

});


// league 관련
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



// 문자중계 관련
app.post("/saveGame", (req, res) => {

  console.log("받았당");
  console.log(req.body.game);

  //pool.getConnection((err, conn) =>{});

});