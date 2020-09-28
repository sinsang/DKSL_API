# DKSL_API
DKSL DATABASE API

# ENDPOINTS
### /getLeagues => 전체 리그정보
 - json 형식은 DB와 동일

### /getLeagueTeams/:leagueId => 해당 leagueId를 가진 리그에 속해있는 팀 정보 
 - json 형식은 DB와 동일

### /getTeamPlayers/:teamId => 해당 teamId를 가진 팀에 속해있는 선수 정보
 - json 형식은 DB와 동일
 
### /getTeamInfo/:teamId => 해당 teamId를 가진 팀의 정보
 - json 형식은 DB와 동일

### /getPlayerStat/:playerId => 해당 playerId를 가진 선수의 기록 (투/타) 
 - { player_info : (선수정보:object), batter_stat : { total : (통산기록:Object), yearly : (연도별기록:Object list) }, pitcher_stat : { total : (통산기록:Object), yearly : (연도별기록:Object list) } };
 - 각 기록의 형식은 DB와 동일

