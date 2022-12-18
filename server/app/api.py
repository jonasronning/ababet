from fastapi import HTTPException
from time import sleep
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from .postgresPool import pool
from string import Template
import bcrypt
from .auth_utils import authUtils
from psycopg2.extras import RealDictCursor
import datetime
import pytz
from dateutil import parser
from zoneinfo import ZoneInfo


try:
    connection = pool.getconn()

except (Exception, psycopg2.DatabaseError) as error:
    print("Error while connecting to PostgreSQL", error)


def fetchDB(query):
    cursor = connection.cursor()
    cursor.execute(query)
    result = cursor.fetchall()
    return result


def fetchDBJson(query):
    cursor = connection.cursor(cursor_factory=RealDictCursor)
    cursor.execute(query)
    result = cursor.fetchall()
    return result


def insertDB(query):
    cursor = connection.cursor()
    cursor.execute(query)
    connection.commit()


# conn = psycopg2.connect(
# host=Credentials.host,
# database=Credentials.db,
# user=Credentials.user,
# password=Credentials.password,
# )
# # create a cursor
# cur = conn.cursor()


# # execute a statement
# print("PostgreSQL database version:")
# cur.execute("SELECT * from accounts;")

# # display the PostgreSQL database server version
# db_version = cur.fetchone()
# print(db_version)


app = FastAPI()

origins = ["*"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/openbets")
async def get_open_bets(token: str = Depends(authUtils.validate_access_token)) -> dict:
    bets = fetchDBJson(
        "select * from bets where bet_status = 1 and is_accepted = true and close_timestamp > NOW() and closed_early IS NULL"
    )
    bets_with_options = []
    for bet in bets:
        options = fetchDBJson(
            Template(
                "select option_id, latest_odds, option_status, option from bet_options where bet = $bet"
            ).safe_substitute({"bet": bet["bet_id"]})
        )
        bet_with_option = bet
        bet_with_option["bet_options"] = options
        bets_with_options.append(bet_with_option)
    print(bets_with_options)
    return bets_with_options


@app.get("/api/requestedbets")
async def get_open_bets(token: str = Depends(authUtils.validate_access_token)) -> dict:
    bets = fetchDBJson("select * from bets where is_accepted = false")
    bets_with_options = []
    for bet in bets:
        options = fetchDBJson(
            Template(
                "select option_id, latest_odds, option_status, option from bet_options where bet = $bet"
            ).safe_substitute({"bet": bet["bet_id"]})
        )
        bet_with_option = bet
        bet_with_option["bet_options"] = options
        bets_with_options.append(bet_with_option)
    print(bets_with_options)
    return bets_with_options


@app.get("/api/leaderboard/")
async def get_open_bets(
    fromDate, toDate, token: str = Depends(authUtils.validate_access_token)
) -> dict:
    print(fromDate, toDate)


@app.get("/api/admin/allbets")
async def get_all_admin_bets(
    token: str = Depends(authUtils.validate_access_token),
) -> dict:
    if is_admin(token["user"]):
        bets = fetchDBJson("select * from bets")
        bets_with_options = [] 
        for bet in bets:
            options = fetchDBJson(
                Template(
                    "select option_id, latest_odds, option_status, option from bet_options where bet = $bet"
                ).safe_substitute({"bet": bet["bet_id"]})
            )
            bet_with_option = bet
            bet_with_option["bet_options"] = options
            bets_with_options.append(bet_with_option)
        print(bets_with_options)
        return bets_with_options
    else:
        raise HTTPException(status_code=403, detail="You are not admin")


@app.get("/api/accums")
async def get_accums(token: str = Depends(authUtils.validate_access_token)) -> dict:
    accums = fetchDB(
        f"select accum_id, stake, total_odds from accums where user_id={token['user_id']}"
    )
    accums_with_options = []
    for accum in accums:
        accum_dict = {"accum_id": accum[0], "stake": accum[1], "total_odds": accum[2]}
        accum_options = fetchDB(
            f"select bets.title, accum_options.user_odds, bet_options.option, bet_options.option_status from bet_options natural join accum_options left join bets on bet_options.bet = bets.bet_id inner join accums on accum_options.accum_id = accums.accum_id where accums.accum_id = {accum[0]};"
        )
        options_list = []
        for option in accum_options:
            option_dict = {
                "bet": option[0],
                "user_odds": option[1],
                "chosen_option": option[2],
                "option_status": option[3],
            }
            options_list.append(option_dict)
        accum_dict["accumBets"] = options_list
        accums_with_options.append(accum_dict)

    return accums_with_options


# @app.get("/admin/allaccums")
# async def read_root() -> dict:
#     return {"message": "Admin"}


@app.get("/api/userAvailability/{user}")
async def user_availability(user: str) -> dict:
    res = fetchDB(f"select exists(select 1 from users where username = '{user}')")
    if res[0][0]:
        return {"userTaken": True}
    else:
        return {"userTaken": False}


@app.get("/api/login/")
async def add_user(user, password) -> dict:
    user_pass = fetchDB(
        Template(
            "select user_id, password from users where username = '$username'"
        ).safe_substitute({"username": user})
    )
    try:
        user_id = user_pass[0][0]
        user_pass = user_pass[0][1]

    except IndexError:
        return {"loggedIn": False}
    if bcrypt.checkpw(password.encode("utf-8"), user_pass.encode("utf-8")):
        jwt = await authUtils.create_access_token(user, user_id)
        return {"loggedIn": True, "jwt": jwt}
    else:
        return {"loggedIn": False}


@app.get("/api/login/details")
async def add_user(
    token: str = Depends(authUtils.validate_access_token_nowhitelist),
) -> dict:

    res = fetchDBJson(
        Template(
            "select username, balance, firstname, lastname, admin from users where username = '$username'"
        ).safe_substitute({"username": token["user"]})
    )
    return res


def is_admin(username):
    res = fetchDBJson(
        Template(
            "select admin from users where username = '$username'"
        ).safe_substitute({"username": username})
    )
    if res[0]["admin"]:
        return True
    else:
        return False


@app.get("/api/admin/users")
async def get_users(token: str = Depends(authUtils.validate_access_token)) -> dict:

    if is_admin(token["user"]):
        res = fetchDBJson(
            "select user_id, username, balance, created_on, last_login, firstname, lastname, admin, whitelist from users"
        )
        return res
    else:
        raise HTTPException(status_code=403, detail="You are not admin")


# {category: "string", title: "string", options: [{latest_odds: number, option: "string"}]}
@app.post("/api/admin/createbet")
async def create_bet(
    bet: dict, token: str = Depends(authUtils.validate_access_token)
) -> dict:
    # date_time_obj = datetime.datetime.strptime(
    #     bet["close_date"], "%Y-%m-%d %H:%M:%S.%f"
    # )
    close_date = parser.parse(bet["close_date"])
    # close_date = parser.parse(bet["close_date"]).replace(
    #     tzinfo=ZoneInfo("Europe/Berlin")
    # )
    print(close_date)
    # print(bet["close_date"].astimezone(pytz.timezone("Europe/Oslo")))
    if is_admin(token["user"]):
        # create bet
        cursor = connection.cursor()
        query1 = Template(
            "insert into bets(category, title, is_accepted, submitter, close_timestamp) values ('$category', '$title', true, '$submitter', '$close_date') RETURNING bet_id"
        ).safe_substitute(
            {
                "category": bet["category"],
                "title": bet["title"],
                "submitter": token["user"],
                "close_date": close_date,
            }
        )
        cursor.execute(query1)
        id_of_bet = cursor.fetchone()[0]

        for option in bet["options"]:
            query2 = Template(
                "insert into bet_options(latest_odds, option, bet) values ($latest_odds, '$option', $bet)"
            ).safe_substitute(
                {
                    "latest_odds": float(option["latest_odds"]),
                    "option": option["option"],
                    "bet": id_of_bet,
                }
            )
            cursor.execute(query2)
        connection.commit()
        return {"settleBet": True}
    else:
        # TODO:
        # change to this and implement frontend to support:
        # raise HTTPException(status_code=403, detail="You are not admin")
        return {"settleBet": False, "errorMsg": "Du er ikke admin"}


@app.post("/api/admin/acceptbet")
async def accept_bet(
    bet: dict, token: str = Depends(authUtils.validate_access_token)
) -> dict:

    if is_admin(token["user"]):
        try:
            cursor = connection.cursor()
            query = Template(
                "update bets set is_accepted = true where bet_id = $bet_id"
            ).safe_substitute({"bet_id": bet["bet_id"]})
            cursor.execute(query)
            connection.commit()
            return {"closeBet": True}
        except Exception as e:
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/admin/updatewl")
async def accept_bet(
    payload: dict, token: str = Depends(authUtils.validate_access_token)
) -> dict:
    print(payload)
    if is_admin(token["user"]):
        try:
            cursor = connection.cursor()
            query = Template(
                "update users set whitelist = $whitelisted where user_id = $user_id"
            ).safe_substitute(
                {"whitelisted": payload["whitelisted"], "user_id": payload["user_id"]}
            )
            cursor.execute(query)
            connection.commit()
            return {"updateWhitelist": True}
        except Exception as e:
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/admin/closebet")
async def accept_bet(
    bet: dict, token: str = Depends(authUtils.validate_access_token)
) -> dict:
    print(bet)

    if is_admin(token["user"]):
        print(bet)
        try:
            cursor = connection.cursor()
            query = Template(
                "update bets set closed_early = NOW() where bet_id = $bet_id"
            ).safe_substitute({"bet_id": bet["bet_id"]})
            cursor.execute(query)
            connection.commit()
            return {"acceptBet": True}
        except Exception as e:
            raise HTTPException(status_code=403, detail="Something went wrong")


@app.post("/api/requestbet")
async def create_bet(
    bet: dict, token: str = Depends(authUtils.validate_access_token)
) -> dict:
    # date_time_obj = datetime.datetime.strptime(
    #     bet["close_date"], "%Y-%m-%d %H:%M:%S.%f"
    # )
    try:
        close_date = parser.parse(bet["close_date"])
        # close_date = parser.parse(bet["close_date"]).replace(
        #     tzinfo=ZoneInfo("Europe/Berlin")
        # )
        print(close_date)
        # print(bet["close_date"].astimezone(pytz.timezone("Europe/Oslo")))
        # create bet
        cursor = connection.cursor()
        query1 = Template(
            "insert into bets(category, title, submitter, close_timestamp) values ('$category', '$title', '$submitter', '$close_date') RETURNING bet_id"
        ).safe_substitute(
            {
                "category": bet["category"],
                "title": bet["title"],
                "submitter": token["user"],
                "close_date": close_date,
            }
        )
        cursor.execute(query1)
        id_of_bet = cursor.fetchone()[0]

        for option in bet["options"]:
            query2 = Template(
                "insert into bet_options(latest_odds, option, bet) values ($latest_odds, '$option', $bet)"
            ).safe_substitute(
                {
                    "latest_odds": float(option["latest_odds"]),
                    "option": option["option"],
                    "bet": id_of_bet,
                }
            )
            cursor.execute(query2)
        connection.commit()
        return {"requestBet": True}
    except error as e:
        # raise HTTPException(status_code=403, detail="You are not admin")
        return {"requestBet": False, "errorMsg": e}


@app.post("/api/admin/settlebet")
async def settle_bet(
    bet: dict, token: str = Depends(authUtils.validate_access_token)
) -> dict:
    print(bet)
    if is_admin(token["user"]):
        # settle bet
        cursor = connection.cursor()
        query1 = Template(
            "update bets set bet_status = 2 where bet_id = $bet_id"
        ).safe_substitute(
            {
                "bet_id": bet["bet_id"],
            }
        )
        cursor.execute(query1)
        for option in bet["bet_options"]:
            query2 = Template(
                "update bet_options set option_status = $option_status where option_id = $option_id"
            ).safe_substitute(
                {
                    "option_status": option["option_status"],
                    "option_id": option["option_id"],
                }
            )
            cursor.execute(query2)
        query_accum_ids = Template(
            "select distinct accum_id from accums natural join accum_options natural join bet_options where bet = $bet_id"
        ).safe_substitute(
            {
                "bet_id": bet["bet_id"],
            }
        )
        accum_ids = fetchDBJson(query_accum_ids)
        for accum in accum_ids:
            accum_id = accum["accum_id"]
            query_accum = Template(
                "select option_status, stake, total_odds, user_id from accum_options left join bet_options on accum_options.option_id = bet_options.option_id left join accums on accum_options.accum_id = accums.accum_id where accums.accum_id = $accum_id"
            ).safe_substitute(
                {
                    "accum_id": accum_id,
                }
            )
            accum = fetchDBJson(query_accum)
            bet_went_in = True
            for option in accum:
                print(option)
                if option["option_status"] != 2:
                    bet_went_in = False
                    break
            if bet_went_in:
                user_id = accum[0]["user_id"]
                pay_out_sum = accum[0]["stake"] * accum[0]["total_odds"]
                query_update_balance = Template(
                    "update users set balance = balance + $pay_out_sum where user_id = $user_id"
                ).safe_substitute(
                    {
                        "pay_out_sum": pay_out_sum,
                        "user_id": user_id,
                    }
                )
                cursor.execute(query_update_balance)
                query_set_paid_out = Template(
                    "update accums set paid_out = true where accum_id = $accum_id"
                ).safe_substitute(
                    {
                        "accum_id": accum_id,
                    }
                )
                cursor.execute(query_set_paid_out)
        connection.commit()
        return {"settleBet": True}
    else:
        # TODO:
        # change to this and implement frontend to support:
        # raise HTTPException(status_code=403, detail="You are not admin")
        return {"settleBet": False, "errorMsg": "Du er ikke admin"}


@app.post("/api/placebet")
async def place_bet(
    bet: dict, token: str = Depends(authUtils.validate_access_token)
) -> dict:
    print(bet["stake"])
    res = fetchDBJson(
        Template(
            "select balance from users where username = '$username'"
        ).safe_substitute({"username": token["user"]})
    )
    # TODO add check if closetime is in future and closed_early is none

    if res[0]["balance"] >= bet["totalodds"]:
        cursor = connection.cursor()
        query1 = Template(
            "insert into accums(stake, total_odds, user_id) values ($stake, $total_odds, $user_id) RETURNING accum_id"
        ).safe_substitute(
            {
                "stake": float(bet["stake"]),
                "total_odds": float(bet["totalodds"]),
                "user_id": int(token["user_id"]),
            }
        )
        cursor.execute(query1)
        id_of_new_accum = cursor.fetchone()[0]
        for option in bet["bets"]:
            print(bet)
            query = Template(
                "insert into accum_options(option_id, accum_id, user_odds) values ($option_id, $accum_id, $user_odds)"
            ).safe_substitute(
                {
                    "option_id": option["option"]["option_id"],
                    "accum_id": id_of_new_accum,
                    "user_odds": option["option"]["latest_odds"],
                }
            )
            cursor.execute(query)
        balance_query = Template(
            "update users set balance = balance - $stake where user_id = $user_id"
        ).safe_substitute(
            {"stake": float(bet["stake"]), "user_id": int(token["user_id"])}
        )
        cursor.execute(balance_query)
        connection.commit()
    else:
        return {
            "placeBet": False,
            "errorMsg": "Ikke nok penger på konto. Feil? Snakk med Lau",
        }

    return {"placeBet": True}


@app.post("/api/createUser")
async def add_user(user: dict) -> dict:

    # hashed = authUtils.create_hashed_password(user["password"])
    hashed = bcrypt.hashpw(bytes(user["password"], encoding="utf-8"), bcrypt.gensalt())
    print(hashed)
    res = insertDB(
        Template(
            "insert into users(username, password, balance, firstname, lastname) values ('$username', '$password', 1000, '$firstname', '$lastname')"
        ).safe_substitute(
            {
                "username": user["username"],
                "password": hashed.decode("utf-8"),
                "firstname": user["firstname"],
                "lastname": user["lastname"],
            }
        )
    )
    return {"userCreated": True}
