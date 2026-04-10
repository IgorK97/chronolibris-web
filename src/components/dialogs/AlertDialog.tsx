import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export const AlertDialog = ({
  open,
  title,
  description,
  handleAccept,
  handleReject,
}: {
  open: boolean;
  title: string;
  description: string;
  handleAccept: () => void;
  handleReject: () => void;
}) => {
  return (
    <Dialog open={open} onClose={handleReject} role="alertdialog">
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button style={{ color: 'red' }} onClick={handleAccept}>
          Подтвердить
        </Button>
        <Button style={{ color: 'red' }} onClick={handleReject} autoFocus>
          Отмена
        </Button>
      </DialogActions>
    </Dialog>
  );
};
