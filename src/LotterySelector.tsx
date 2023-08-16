import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import Typography from "@mui/material/Typography";
import { Stack } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";
const startNumber = 1;
const endNumber = 66;
const lengthOfLottery = 6;
interface TabPanelProps {
  lottery: string;
  generateRandomLottery: () => Promise<string>;
  onSave: (lottery: string) => void;
  onDelete: () => void;
}

function CustomTabPanel(props: TabPanelProps) {
  const { lottery, onDelete, generateRandomLottery, onSave } = props;
  const [selected, setSelected] = React.useState<number[]>([]);
  React.useEffect(() => {
    if (lottery === "") {
      setSelected([]);
    } else {
      setSelected(lottery.split(",").map((item) => parseInt(item)));
    }
  }, [lottery]);
  const [loading, setLoading] = React.useState(false);
  const autoPick = async () => {
    setLoading(true);
    const lotto = await generateRandomLottery();
    setLoading(false);
    setSelected(lotto.split(",").map((item) => parseInt(item)));
  };

  const selectNumber = (number: number) => {
    if (selected.includes(number)) {
      setSelected(selected.filter((item) => item !== number));
    } else {
      if (selected.length < lengthOfLottery) {
        setSelected([...selected, number]);
      }
    }
  };

  return (
    <div role="tabpanel">
      <Stack
        direction="column"
        spacing={2}
        sx={{ padding: 2, alignItems: "center" }}
      >
        <Typography>Pick {lengthOfLottery} numbers</Typography>
        <Button variant="contained" onClick={autoPick}>
          Auto Pick
        </Button>
        <Typography>
          {selected.length} of {lengthOfLottery} Selected
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          {Array.from({ length: endNumber }, (_, i) => i + 1).map((number) => (
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "1px solid #add8e6",
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => selectNumber(number)}
              key={number}
            >
              <div
                style={{
                  //   backgroundColor: selected.includes(number)
                  //     ? "white"
                  //     : "black",
                  backgroundColor: "#F0F0F0",
                  borderStyle: "solid",
                  borderWidth: "10px",
                  borderColor: selected.includes(number)
                    ? "#153C6D"
                    : "#C0C0C0",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography
                  color={selected.includes(number) ? "#153C6D" : "#333333"}
                  sx={{
                    fontWeight: selected.includes(number) ? "bold" : "normal",
                    fontSize: "20px",
                    userSelect: "none",
                  }}
                >
                  {number}
                </Typography>
              </div>
            </div>
          ))}
        </Stack>
        <Stack direction="row" spacing={4} sx={{ paddingTop: "20px" }}>
          <Button
            disabled={selected.length !== lengthOfLottery}
            variant="contained"
            color="success"
            onClick={() => onSave(selected.join(","))}
          >
            Save this ticket
          </Button>
          <Button
            disabled={lottery === ""}
            variant="contained"
            color="warning"
            onClick={onDelete}
          >
            Delete this ticket
          </Button>
        </Stack>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Stack>
    </div>
  );
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function LotterySelector({
  open,
  setOpen,
  generateRandomLottery,
  onFinish,
  autoPickCount,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  onFinish: (lotteries: string[]) => void;
  generateRandomLottery: () => Promise<string>;
  autoPickCount?: number;
}) {
  const handleClose = () => {
    setOpen(false);
  };

  const [value, setValue] = React.useState(0);
  const [lotteries, setLotteries] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setLotteries([]);
      setValue(0);
      if (autoPickCount !== undefined && autoPickCount > 0) {
        async function autoPick(count: number) {
          setLoading(true);
          const list: string[] = [];
          for (let i = 0; i < count; i++) {
            const number = await generateRandomLottery();
            list.push(number);
          }
          setLotteries(list);
          setLoading(false);
        }
        setTimeout(() => {
          autoPick(autoPickCount);
        }, 200);
      }
    }
  }, [open, autoPickCount]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const onSave = (lottery: string) => {
    if (value === lotteries.length) {
      setLotteries([...lotteries, lottery]);
    } else {
      setLotteries(
        lotteries.map((item, index) => (index === value ? lottery : item))
      );
    }
  };

  const onDelete = () => {
    setLotteries(lotteries.filter((_, i) => i !== value));
    setValue((old) => (old > 0 ? old - 1 : 0));
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      maxWidth="lg"
      onClose={handleClose}
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle>{"Select Numbers"}</DialogTitle>
      <DialogContent sx={{ width: 1000 }}>
        <Box sx={{ height: "600px", width: "100%" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {lotteries.map((lottery, index) => (
                <Tab
                  label={`ticket-${index + 1}`}
                  id={`simple-tab-${index}`}
                  key={index}
                />
              ))}

              <Tab
                icon={<AddIcon />}
                iconPosition="end"
                id={`simple-tab-${lotteries.length}`}
              />
            </Tabs>
          </Box>
          <CustomTabPanel
            lottery={value === lotteries.length ? "" : lotteries[value]}
            generateRandomLottery={generateRandomLottery}
            onSave={onSave}
            onDelete={onDelete}
          />
          <Backdrop
            sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={loading}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={() => {
            onFinish(lotteries);
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
