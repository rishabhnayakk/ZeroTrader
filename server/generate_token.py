import os
import sys
import urllib.parse
from dotenv import load_dotenv
from kiteconnect import KiteConnect

load_dotenv()

api_key = os.getenv("ZERODHA_API_KEY")
api_secret = os.getenv("ZERODHA_API_SECRET")

if not api_key or api_key == "your_api_key_here":
    api_key = input("Enter your Zerodha API Key: ").strip()

if not api_secret or api_secret == "your_api_secret_here":
    api_secret = input("Enter your Zerodha API Secret: ").strip()

kite = KiteConnect(api_key=api_key)


def display_account_overview(kite_client, profile=None):
    """Fetch and display account profile and live funds/margins."""
    if not profile:
        try:
            profile = kite_client.profile()
        except Exception as e:
            profile = None
            print(f"Connected Account: (Could not fetch profile: {e})")

    if profile:
        user_name = profile.get("user_name", "N/A")
        user_id = profile.get("user_id", "N/A")
        email = profile.get("email", "")
        broker = profile.get("broker", "Zerodha")
        email_str = f" | {email}" if email else ""
        print(f"Connected Account: {user_name} ({user_id}){email_str} [{broker}]")

    try:
        margins = kite_client.margins()
        print("-" * 65)
        print("💰 CURRENT ACCOUNT BALANCE & FUNDS:")
        print("-" * 65)

        has_printed = False

        # Equity Segment
        equity = margins.get("equity", {})
        if equity and (equity.get("enabled", True) or "available" in equity):
            avail = equity.get("available", {})
            util = equity.get("utilised", {})

            # live_balance is the live available cash balance to trade
            live_bal = avail.get("live_balance", avail.get("cash", 0.0)) or 0.0
            net_bal = equity.get("net", live_bal) or 0.0
            opening_bal = avail.get("opening_balance", 0.0) or 0.0
            used_margin = util.get("debits", 0.0) or 0.0
            collateral = avail.get("collateral", 0.0) or 0.0
            payin = avail.get("intraday_payin", 0.0) or 0.0

            print("  📊 Equity Segment:")
            print(f"     • Current Available Cash : ₹{live_bal:,.2f}")
            print(f"     • Net Account Balance    : ₹{net_bal:,.2f}")
            print(f"     • Opening Balance        : ₹{opening_bal:,.2f}")
            print(f"     • Margin Used (Debits)   : ₹{used_margin:,.2f}")
            if collateral > 0:
                print(f"     • Collateral Margin      : ₹{collateral:,.2f}")
            if payin > 0:
                print(f"     • Intraday Payin         : ₹{payin:,.2f}")
            has_printed = True

        # Commodity Segment
        commodity = margins.get("commodity", {})
        if commodity and commodity.get("enabled", False):
            avail_c = commodity.get("available", {})
            util_c = commodity.get("utilised", {})
            live_c = avail_c.get("live_balance", avail_c.get("cash", 0.0)) or 0.0
            net_c = commodity.get("net", live_c) or 0.0
            used_c = util_c.get("debits", 0.0) or 0.0

            if has_printed:
                print()
            print("  📦 Commodity Segment:")
            print(f"     • Current Available Cash : ₹{live_c:,.2f}")
            print(f"     • Net Commodity Balance  : ₹{net_c:,.2f}")
            if used_c > 0:
                print(f"     • Margin Used (Debits)   : ₹{used_c:,.2f}")
            has_printed = True

        if not has_printed:
            print(f"  • Funds & Margins Data: {margins}")

    except Exception as me:
        print(f"\n⚠️  Could not fetch account amount/balance: {me}")


# Check if an existing access token is already valid
existing_token = os.getenv("ZERODHA_ACCESS_TOKEN")
if existing_token and existing_token != "your_access_token_here":
    kite.set_access_token(existing_token)
    try:
        active_profile = kite.profile()
        print("\n" + "=" * 65)
        print("⚡ Active session already found in server/.env:")
        print("=" * 65)
        print(f"Access Token: {existing_token}")
        display_account_overview(kite, active_profile)
        print("=" * 65)
        choice = input("\n👉 Token is active. Regenerate new session anyway? (y/N): ").strip().lower()
        if choice not in ("y", "yes"):
            print("\nKeeping existing session. Done!\n")
            sys.exit(0)
    except Exception:
        # Token expired or invalid, proceed with login flow
        pass

login_url = kite.login_url()

print("\n" + "=" * 65)
print("👉 STEP 1: Open this link in your browser to log in:")
print("=" * 65)
print(login_url)
print("=" * 65 + "\n")

user_input = input("👉 STEP 2: After logging in, paste the request_token (or full redirected URL):\n> ").strip()

# Extract request_token if the user pasted the entire URL
request_token = user_input
if "request_token=" in user_input:
    parsed = urllib.parse.urlparse(user_input)
    params = urllib.parse.parse_qs(parsed.query)
    request_token = params.get("request_token", [user_input])[0]

print(f"\nGenerating Access Token with request_token...")

try:
    data = kite.generate_session(request_token, api_secret=api_secret)
    access_token = data["access_token"]
    kite.set_access_token(access_token)

    # Save to server/.env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    lines = []
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()

    new_lines = []
    has_token = False
    has_key = False
    has_secret = False
    for line in lines:
        if line.startswith("ZERODHA_ACCESS_TOKEN="):
            new_lines.append(f"ZERODHA_ACCESS_TOKEN={access_token}\n")
            has_token = True
        elif line.startswith("ZERODHA_API_KEY="):
            new_lines.append(f"ZERODHA_API_KEY={api_key}\n")
            has_key = True
        elif line.startswith("ZERODHA_API_SECRET="):
            new_lines.append(f"ZERODHA_API_SECRET={api_secret}\n")
            has_secret = True
        else:
            new_lines.append(line)

    if not has_token:
        new_lines.append(f"ZERODHA_ACCESS_TOKEN={access_token}\n")
    if not has_key:
        new_lines.append(f"ZERODHA_API_KEY={api_key}\n")
    if not has_secret:
        new_lines.append(f"ZERODHA_API_SECRET={api_secret}\n")

    with open(env_path, "w") as f:
        f.writelines(new_lines)

    print("\n" + "=" * 65)
    print("✅ SUCCESS! Access Token generated and saved to server/.env")
    print("=" * 65)
    print(f"Access Token: {access_token}")
    display_account_overview(kite)
    print("=" * 65 + "\n")

except Exception as e:
    print(f"\n❌ Error generating access token: {e}\n")
