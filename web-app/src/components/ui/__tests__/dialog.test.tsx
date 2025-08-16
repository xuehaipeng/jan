import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import React from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../dialog'

describe('Dialog Components', () => {
  it('renders dialog trigger', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    )
    
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    expect(screen.getByText('Dialog Title')).toBeInTheDocument()
  })

  it('renders dialog content with proper structure', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <div>Dialog body content</div>
          <DialogFooter>
            <button>Footer button</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    expect(screen.getByText('Dialog description')).toBeInTheDocument()
    expect(screen.getByText('Dialog body content')).toBeInTheDocument()
    expect(screen.getByText('Footer button')).toBeInTheDocument()
  })

  it('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    
    // Click the close button (X)
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('closes dialog when escape key is pressed', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    
    await user.keyboard('{Escape}')
    
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('applies proper classes to dialog content', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    const dialogContent = screen.getByRole('dialog')
    expect(dialogContent).toHaveClass(
      'bg-main-view',
      'fixed',
      'top-[50%]',
      'left-[50%]',
      'z-50',
      'translate-x-[-50%]',
      'translate-y-[-50%]',
      'border',
      'rounded-lg',
      'shadow-lg'
    )
  })

  it('applies proper classes to dialog header', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    const dialogHeader = screen.getByText('Dialog Title').closest('div')
    expect(dialogHeader).toHaveClass('flex', 'flex-col', 'gap-2', 'text-center')
  })

  it('applies proper classes to dialog title', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    const dialogTitle = screen.getByText('Dialog Title')
    expect(dialogTitle).toHaveClass('text-lg', 'leading-none', 'font-medium')
  })

  it('applies proper classes to dialog description', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    const dialogDescription = screen.getByText('Dialog description')
    expect(dialogDescription).toHaveClass('text-main-view-fg/80', 'text-sm')
  })

  it('applies proper classes to dialog footer', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <button>Footer button</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    const dialogFooter = screen.getByText('Footer button').closest('div')
    expect(dialogFooter).toHaveClass('flex', 'flex-col-reverse', 'gap-2', 'sm:flex-row', 'sm:justify-end')
  })

  it('can be controlled externally', () => {
    const TestComponent = () => {
      const [open, setOpen] = React.useState(false)
      
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
    }
    
    render(<TestComponent />)
    
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('prevents background interaction when open', async () => {
    const user = userEvent.setup()
    const backgroundClickHandler = vi.fn()
    
    render(
      <div>
        <button onClick={backgroundClickHandler}>Background Button</button>
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    // Check that background button has pointer-events: none due to modal overlay
    const backgroundButton = screen.getByText('Background Button')
    expect(backgroundButton).toHaveStyle('pointer-events: none')
  })

  it('accepts custom className for content', async () => {
    const user = userEvent.setup()
    
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent className="custom-dialog-class">
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    const dialogContent = screen.getByRole('dialog')
    expect(dialogContent).toHaveClass('custom-dialog-class')
  })

  it('supports onOpenChange callback', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <Dialog onOpenChange={onOpenChange}>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    await user.click(screen.getByText('Open Dialog'))
    
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })
})