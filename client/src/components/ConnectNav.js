import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, Avatar, Badge, Button } from "antd";
import moment from "moment";
import { getAccountBalance, currencyFormatter, payoutSetting } from "../actions/stripe";
import { SettingOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

const { Meta } = Card;
const { Ribbon } = Badge;

const ConnectNav = () => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const { auth } = useSelector((state) => ({ ...state }));
  const { user, token } = auth || {};

  useEffect(() => {
    if (token) {
      getAccountBalance(token)
        .then((res) => {
          setBalance(res?.data || 0);
        })
        .catch((err) => {
          console.log("Balance fetch error", err);
        });
    }
  }, [token]);

  const handlePayoutSettings = async () => {
    setLoading(true);
    try {
      const res = await payoutSetting(token);
      window.location.href = res?.data?.url || "/";
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
      toast("Unable to access settings. Try again");
    }
  };

  const handleConnectStripe = () => {
    window.location.href = "/stripe/onboard"; // Or your onboarding route
  };

  return (
    <div className="d-flex justify-content-around flex-wrap">
      <Card>
        <Meta
          avatar={<Avatar>{user?.name?.[0] || "U"}</Avatar>}
          title={user?.name || "User"}
          description={`Joined ${user?.createdAt ? moment(user.createdAt).fromNow() : "N/A"}`}
        />
      </Card>
      {auth &&
        auth.user &&
        auth.user.stripe_seller &&
        auth.user.stripe_seller.charges_enabled && (
          <>
            <Ribbon text="Avaliable" color="grey">
              <Card className="bg-light pt-1">
                {balance &&
                  balance.pending &&
                  balance.pending.map((bp, i) => (
                    <span key={i} className="lead">
                      {currencyFormatter(bp)}
                    </span>
                  ))}
              </Card>
            </Ribbon>
            <Ribbon text="Payouts" color="silver">
              <Card onClick={handlePayoutSettings} className="bg-light pointer">
                <SettingOutlined className="h5 pt-2" />
              </Card>
            </Ribbon>
          </>
        )}
    </div>
  );
};

export default ConnectNav;
